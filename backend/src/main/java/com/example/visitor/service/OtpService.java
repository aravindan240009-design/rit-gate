package com.example.visitor.service;

import com.example.visitor.entity.OtpCode;
import com.example.visitor.repository.OtpCodeRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Durable OTP store backed by MySQL (otp_codes). Encapsulates everything
 * AuthController used to do with its in-memory ConcurrentHashMaps so pending
 * OTPs survive backend restarts. HTTP behaviour is unchanged — only storage moved.
 */
@Service
public class OtpService {

    /**
     * Longest burst window the service throttles against. Cleanup keeps rows
     * younger than this so counters are never wiped mid-window.
     */
    public static final int BURST_WINDOW_MINUTES = 10;

    private final OtpCodeRepository otpCodeRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public OtpService(OtpCodeRepository otpCodeRepository) {
        this.otpCodeRepository = otpCodeRepository;
    }

    // ---- Rate limiting (OTP send / resend) ----

    /**
     * Outcome of a send/resend throttle check.
     *
     * @param allowed      whether the send may proceed
     * @param waitSeconds  seconds the caller must wait before retrying
     * @param reason       COOLDOWN (too soon after the last send), BURST (window cap
     *                     exhausted) or LOCKED (attempt cap tripped a lockout)
     */
    public record RateLimitResult(boolean allowed, long waitSeconds, LimitReason reason) {}

    public enum LimitReason { NONE, COOLDOWN, BURST, LOCKED }

    /**
     * Throttles OTP sends for a key on three independent axes:
     *   1. LOCKED   — an active lockout from too many failed verifications.
     *   2. COOLDOWN — a minimum gap (rateLimitSeconds) between consecutive sends.
     *   3. BURST    — at most maxPerWindow sends inside a rolling windowMinutes window.
     *
     * On allow, stamps last_request_at and advances the burst counter so the next
     * request is measured against this one. Rows are upserted lazily — a brand-new
     * key simply has no prior row.
     *
     * IMPORTANT: the key must be the same one storeOtp()/verifyOtp() use (the user's
     * email). Using a different key here would silently disable throttling, because
     * the counters would live on a row nothing else ever reads.
     */
    @Transactional
    public RateLimitResult checkRateLimit(String email, int rateLimitSeconds,
                                          int maxPerWindow, int windowMinutes) {
        LocalDateTime now = LocalDateTime.now();
        Optional<OtpCode> existing = otpCodeRepository.findById(email);

        if (existing.isPresent()) {
            OtpCode current = existing.get();

            // 1. Hard lockout from repeated failed verification attempts.
            if (current.getLockedUntil() != null && now.isBefore(current.getLockedUntil())) {
                long wait = java.time.Duration.between(now, current.getLockedUntil()).getSeconds();
                return new RateLimitResult(false, Math.max(wait, 1), LimitReason.LOCKED);
            }

            // 2. Per-send cooldown.
            if (current.getLastRequestAt() != null) {
                long elapsed = java.time.Duration.between(current.getLastRequestAt(), now).getSeconds();
                if (elapsed < rateLimitSeconds) {
                    return new RateLimitResult(false, rateLimitSeconds - elapsed, LimitReason.COOLDOWN);
                }
            }

            // 3. Burst cap across the rolling window.
            if (current.getWindowStartedAt() != null) {
                long windowAge = java.time.Duration.between(current.getWindowStartedAt(), now).toMinutes();
                int count = current.getRequestCount() == null ? 0 : current.getRequestCount();
                if (windowAge < windowMinutes && count >= maxPerWindow) {
                    long wait = java.time.Duration.between(
                        now, current.getWindowStartedAt().plusMinutes(windowMinutes)).getSeconds();
                    return new RateLimitResult(false, Math.max(wait, 1), LimitReason.BURST);
                }
            }
        }

        // Stamp the request time (create a placeholder row if none exists yet).
        OtpCode row = existing.orElseGet(() -> {
            OtpCode o = new OtpCode();
            o.setEmail(email);
            o.setHashedOtp("");           // not a usable OTP until storeOtp() runs
            o.setCreatedAt(now);
            o.setExpiresAt(now);          // already expired; storeOtp() will set the real window
            return o;
        });

        // Open a fresh burst window when there is none or the old one has aged out.
        boolean windowExpired = row.getWindowStartedAt() == null
            || java.time.Duration.between(row.getWindowStartedAt(), now).toMinutes() >= windowMinutes;
        if (windowExpired) {
            row.setWindowStartedAt(now);
            row.setRequestCount(1);
        } else {
            row.setRequestCount((row.getRequestCount() == null ? 0 : row.getRequestCount()) + 1);
        }

        row.setLastRequestAt(now);
        row.setLockedUntil(null);
        otpCodeRepository.save(row);
        return new RateLimitResult(true, 0, LimitReason.NONE);
    }

    // ---- Storing a freshly generated OTP ----

    /**
     * Hash and persist a new OTP for this email, replacing any previous one.
     * Issuing a fresh OTP invalidates the old one — a resend makes the previously
     * emailed code unusable, so only the newest code ever verifies.
     *
     * Burst-window counters (request_count / window_started_at) are deliberately
     * carried over: they are owned by checkRateLimit() and resetting them here
     * would let a caller sidestep the window cap simply by requesting again.
     */
    @Transactional
    public void storeOtp(String email, String plainOtp, int expiryMinutes) {
        LocalDateTime now = LocalDateTime.now();
        OtpCode row = otpCodeRepository.findById(email).orElseGet(OtpCode::new);
        row.setEmail(email);
        row.setHashedOtp(passwordEncoder.encode(plainOtp));
        row.setCreatedAt(now);
        row.setExpiresAt(now.plusMinutes(expiryMinutes));
        row.setAttempts(0);
        row.setLockedUntil(null);
        if (row.getLastRequestAt() == null) {
            row.setLastRequestAt(now);
        }
        otpCodeRepository.save(row);
    }

    // ---- Verification ----

    public enum VerifyOutcome { SUCCESS, NO_OTP, EXPIRED, MAX_ATTEMPTS, LOCKED, INVALID }

    public record VerifyResult(VerifyOutcome outcome, int remainingAttempts, long lockSeconds) {}

    /**
     * Verifies a submitted OTP: existence, active lockout, expiry, attempt cap,
     * BCrypt match, increment-on-fail, consume-on-success.
     *
     * On exhausting maxAttempts the row is KEPT and stamped with locked_until.
     * Deleting it instead (the old behaviour) made the cap trivially bypassable —
     * the attacker just requested a new OTP and got a fresh set of attempts.
     */
    @Transactional
    public VerifyResult verifyOtp(String email, String otp, int maxAttempts, int lockMinutes) {
        Optional<OtpCode> opt = otpCodeRepository.findById(email);
        if (opt.isEmpty()) {
            return new VerifyResult(VerifyOutcome.NO_OTP, 0, 0);
        }
        OtpCode row = opt.get();
        LocalDateTime now = LocalDateTime.now();

        // The lockout is checked FIRST — ahead of the "is there a code?" test.
        // Tripping the cap blanks hashed_otp, so an empty-code check placed first
        // would report NO_OTP and hide the fact that the account is locked.
        if (row.getLockedUntil() != null && now.isBefore(row.getLockedUntil())) {
            long wait = java.time.Duration.between(now, row.getLockedUntil()).getSeconds();
            return new VerifyResult(VerifyOutcome.LOCKED, 0, Math.max(wait, 1));
        }

        // Placeholder row (rate-limit stamp only, or a consumed/expired code).
        if (row.getHashedOtp() == null || row.getHashedOtp().isEmpty()) {
            return new VerifyResult(VerifyOutcome.NO_OTP, 0, 0);
        }

        if (now.isAfter(row.getExpiresAt())) {
            // Clear the code but keep the row so burst counters survive.
            row.setHashedOtp("");
            otpCodeRepository.save(row);
            return new VerifyResult(VerifyOutcome.EXPIRED, 0, 0);
        }

        if (row.getAttempts() >= maxAttempts) {
            row.setHashedOtp("");
            row.setLockedUntil(now.plusMinutes(lockMinutes));
            otpCodeRepository.save(row);
            return new VerifyResult(VerifyOutcome.MAX_ATTEMPTS, 0, lockMinutes * 60L);
        }

        if (!passwordEncoder.matches(otp, row.getHashedOtp())) {
            row.setAttempts(row.getAttempts() + 1);
            int remaining = Math.max(0, maxAttempts - row.getAttempts());
            if (remaining == 0) {
                // Cap just exhausted — burn the code and start the lockout now.
                row.setHashedOtp("");
                row.setLockedUntil(now.plusMinutes(lockMinutes));
                otpCodeRepository.save(row);
                return new VerifyResult(VerifyOutcome.MAX_ATTEMPTS, 0, lockMinutes * 60L);
            }
            otpCodeRepository.save(row);
            return new VerifyResult(VerifyOutcome.INVALID, remaining, 0);
        }

        // Success — consume the OTP so it can't be reused, but keep the row
        // (and its burst counters) so send throttling still applies.
        row.setHashedOtp("");
        row.setAttempts(0);
        row.setLockedUntil(null);
        otpCodeRepository.save(row);
        return new VerifyResult(VerifyOutcome.SUCCESS, 0, 0);
    }

    // ---- Cleanup of expired rows ----

    /**
     * Periodically purge spent OTP rows so the table stays small. Rows still
     * carrying an active lockout or an open burst window are retained — see
     * OtpCodeRepository.deleteExpired.
     */
    @Scheduled(fixedRate = 15 * 60 * 1000) // every 15 minutes
    @Transactional
    public void cleanupExpired() {
        try {
            LocalDateTime now = LocalDateTime.now();
            // Keep rows whose burst window is still open (widest window in use).
            int removed = otpCodeRepository.deleteExpired(now, now.minusMinutes(BURST_WINDOW_MINUTES));
            if (removed > 0) {
                System.out.println("🧹 OTP cleanup: removed " + removed + " expired row(s)");
            }
        } catch (Exception e) {
            System.err.println("⚠️ OTP cleanup failed: " + e.getMessage());
        }
    }
}
