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

    private final OtpCodeRepository otpCodeRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public OtpService(OtpCodeRepository otpCodeRepository) {
        this.otpCodeRepository = otpCodeRepository;
    }

    // ---- Rate limiting (OTP resend) ----

    public record RateLimitResult(boolean allowed, long waitSeconds) {}

    /**
     * Allows a send if no OTP was requested for this email within rateLimitSeconds.
     * On allow, stamps last_request_at so the next request is throttled. Rows are
     * upserted lazily — a brand-new email simply has no prior row.
     */
    @Transactional
    public RateLimitResult checkRateLimit(String email, int rateLimitSeconds) {
        LocalDateTime now = LocalDateTime.now();
        Optional<OtpCode> existing = otpCodeRepository.findById(email);
        if (existing.isPresent() && existing.get().getLastRequestAt() != null) {
            long elapsed = java.time.Duration.between(existing.get().getLastRequestAt(), now).getSeconds();
            if (elapsed < rateLimitSeconds) {
                return new RateLimitResult(false, rateLimitSeconds - elapsed);
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
        row.setLastRequestAt(now);
        otpCodeRepository.save(row);
        return new RateLimitResult(true, 0);
    }

    // ---- Storing a freshly generated OTP ----

    /** Hash and persist a new OTP for this email, replacing any previous one. */
    @Transactional
    public void storeOtp(String email, String plainOtp, int expiryMinutes) {
        LocalDateTime now = LocalDateTime.now();
        OtpCode row = otpCodeRepository.findById(email).orElseGet(OtpCode::new);
        row.setEmail(email);
        row.setHashedOtp(passwordEncoder.encode(plainOtp));
        row.setCreatedAt(now);
        row.setExpiresAt(now.plusMinutes(expiryMinutes));
        row.setAttempts(0);
        if (row.getLastRequestAt() == null) {
            row.setLastRequestAt(now);
        }
        otpCodeRepository.save(row);
    }

    // ---- Verification ----

    public enum VerifyOutcome { SUCCESS, NO_OTP, EXPIRED, MAX_ATTEMPTS, INVALID }

    public record VerifyResult(VerifyOutcome outcome, int remainingAttempts) {}

    /**
     * Mirrors the old verifyOTPWithAttempts logic: existence, expiry, attempt cap,
     * BCrypt match, increment-on-fail, delete-on-success.
     */
    @Transactional
    public VerifyResult verifyOtp(String email, String otp, int maxAttempts) {
        Optional<OtpCode> opt = otpCodeRepository.findById(email);
        // Treat a placeholder row (no real OTP stored yet) as "no OTP".
        if (opt.isEmpty() || opt.get().getHashedOtp() == null || opt.get().getHashedOtp().isEmpty()) {
            return new VerifyResult(VerifyOutcome.NO_OTP, 0);
        }
        OtpCode row = opt.get();

        if (LocalDateTime.now().isAfter(row.getExpiresAt())) {
            otpCodeRepository.delete(row);
            return new VerifyResult(VerifyOutcome.EXPIRED, 0);
        }

        if (row.getAttempts() >= maxAttempts) {
            otpCodeRepository.delete(row);
            return new VerifyResult(VerifyOutcome.MAX_ATTEMPTS, 0);
        }

        if (!passwordEncoder.matches(otp, row.getHashedOtp())) {
            row.setAttempts(row.getAttempts() + 1);
            otpCodeRepository.save(row);
            int remaining = Math.max(0, maxAttempts - row.getAttempts());
            return new VerifyResult(VerifyOutcome.INVALID, remaining);
        }

        // Success — consume the OTP so it can't be reused.
        otpCodeRepository.delete(row);
        return new VerifyResult(VerifyOutcome.SUCCESS, 0);
    }

    // ---- Cleanup of expired rows ----

    /** Periodically purge expired OTP rows so the table stays small. */
    @Scheduled(fixedRate = 15 * 60 * 1000) // every 15 minutes
    @Transactional
    public void cleanupExpired() {
        try {
            int removed = otpCodeRepository.deleteExpired(LocalDateTime.now());
            if (removed > 0) {
                System.out.println("🧹 OTP cleanup: removed " + removed + " expired row(s)");
            }
        } catch (Exception e) {
            System.err.println("⚠️ OTP cleanup failed: " + e.getMessage());
        }
    }
}
