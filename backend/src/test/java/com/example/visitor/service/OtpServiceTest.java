package com.example.visitor.service;

import com.example.visitor.entity.OtpCode;
import com.example.visitor.repository.OtpCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Locks in the OTP security guarantees from the production-readiness checklist:
 * single use, 5-minute expiry, a 5-attempt cap that then locks the account, and
 * a send throttle (cooldown + 5-per-10-minutes burst cap) that a resend cannot
 * sidestep.
 */
@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    private static final String EMAIL = "student@ritchennai.edu.in";
    private static final int EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_PER_WINDOW = 5;
    private static final int WINDOW_MINUTES = 10;

    @Mock
    private OtpCodeRepository otpCodeRepository;

    @InjectMocks
    private OtpService otpService;

    /** In-memory stand-in for the otp_codes table. */
    private Map<String, OtpCode> table;

    @BeforeEach
    void setUp() {
        table = new HashMap<>();
        when(otpCodeRepository.findById(anyString()))
            .thenAnswer(inv -> Optional.ofNullable(table.get(inv.getArgument(0))));
        when(otpCodeRepository.save(any(OtpCode.class))).thenAnswer(inv -> {
            OtpCode row = inv.getArgument(0);
            table.put(row.getEmail(), row);
            return row;
        });
    }

    private OtpService.RateLimitResult send() {
        return otpService.checkRateLimit(EMAIL, COOLDOWN_SECONDS, MAX_PER_WINDOW, WINDOW_MINUTES);
    }

    private OtpService.VerifyResult verify(String otp) {
        return otpService.verifyOtp(EMAIL, otp, MAX_ATTEMPTS, LOCK_MINUTES);
    }

    // ---- Single use ----

    @Test
    void correctOtpVerifiesOnce_andCannotBeReused() {
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);

        assertEquals(OtpService.VerifyOutcome.SUCCESS, verify("123456").outcome());
        // Second presentation of the same code must fail — it was consumed.
        assertEquals(OtpService.VerifyOutcome.NO_OTP, verify("123456").outcome());
    }

    @Test
    void resendInvalidatesThePreviousOtp() {
        otpService.storeOtp(EMAIL, "111111", EXPIRY_MINUTES);
        otpService.storeOtp(EMAIL, "222222", EXPIRY_MINUTES); // resend

        assertEquals(OtpService.VerifyOutcome.INVALID, verify("111111").outcome(),
            "the superseded code must no longer verify");
        assertEquals(OtpService.VerifyOutcome.SUCCESS, verify("222222").outcome());
    }

    // ---- Expiry ----

    @Test
    void expiredOtpIsRejected() {
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);
        // Backdate the window so it has already lapsed.
        table.get(EMAIL).setExpiresAt(LocalDateTime.now().minusSeconds(1));

        assertEquals(OtpService.VerifyOutcome.EXPIRED, verify("123456").outcome());
    }

    @Test
    void otpExpiryWindowIsFiveMinutes() {
        LocalDateTime before = LocalDateTime.now();
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);

        LocalDateTime expiresAt = table.get(EMAIL).getExpiresAt();
        assertFalse(expiresAt.isBefore(before.plusMinutes(EXPIRY_MINUTES).minusSeconds(5)));
        assertFalse(expiresAt.isAfter(before.plusMinutes(EXPIRY_MINUTES).plusSeconds(5)));
    }

    // ---- Attempt cap + lockout ----

    @Test
    void fifthWrongAttemptLocksTheAccount() {
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);

        // Attempts 1-4 are merely invalid, each reporting the remaining budget.
        for (int i = 1; i < MAX_ATTEMPTS; i++) {
            OtpService.VerifyResult r = verify("000000");
            assertEquals(OtpService.VerifyOutcome.INVALID, r.outcome(), "attempt " + i);
            assertEquals(MAX_ATTEMPTS - i, r.remainingAttempts(), "attempt " + i);
        }

        // The 5th exhausts the cap and trips the lock.
        OtpService.VerifyResult last = verify("000000");
        assertEquals(OtpService.VerifyOutcome.MAX_ATTEMPTS, last.outcome());
        assertNotNull(table.get(EMAIL).getLockedUntil());
    }

    @Test
    void correctOtpIsRefusedWhileLocked() {
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            verify("000000");
        }

        // Even the right code must not get in during the lockout.
        assertEquals(OtpService.VerifyOutcome.LOCKED, verify("123456").outcome());
    }

    @Test
    void lockoutSurvivesARequestForANewOtp() {
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            verify("000000");
        }

        // Requesting a fresh OTP must not hand back a clean slate: the row (and
        // its lock) is retained, so the send is refused.
        OtpService.RateLimitResult resend = send();
        assertFalse(resend.allowed());
        assertEquals(OtpService.LimitReason.LOCKED, resend.reason());
    }

    // ---- Send throttle ----

    @Test
    void secondSendWithinCooldownIsRefused() {
        assertTrue(send().allowed(), "first send should pass");

        OtpService.RateLimitResult second = send();
        assertFalse(second.allowed());
        assertEquals(OtpService.LimitReason.COOLDOWN, second.reason());
        assertTrue(second.waitSeconds() > 0);
    }

    @Test
    void atMostFiveSendsPerTenMinuteWindow() {
        for (int i = 1; i <= MAX_PER_WINDOW; i++) {
            assertTrue(send().allowed(), "send " + i + " should be allowed");
            // Clear the per-send cooldown so only the burst cap is under test.
            table.get(EMAIL).setLastRequestAt(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS + 1));
        }

        OtpService.RateLimitResult sixth = send();
        assertFalse(sixth.allowed(), "the 6th send inside the window must be refused");
        assertEquals(OtpService.LimitReason.BURST, sixth.reason());
    }

    @Test
    void burstCounterResetsOnceTheWindowElapses() {
        for (int i = 0; i < MAX_PER_WINDOW; i++) {
            send();
            table.get(EMAIL).setLastRequestAt(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS + 1));
        }
        assertFalse(send().allowed());

        // Age the window out; the budget should be restored.
        OtpCode row = table.get(EMAIL);
        row.setWindowStartedAt(LocalDateTime.now().minusMinutes(WINDOW_MINUTES + 1));
        row.setLastRequestAt(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS + 1));

        assertTrue(send().allowed(), "a new window should allow sending again");
    }

    @Test
    void storeOtpDoesNotResetTheBurstCounter() {
        send();
        int afterFirstSend = table.get(EMAIL).getRequestCount();

        // Issuing the code must not clear the throttle counters, or a caller could
        // reset the window just by completing a send.
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);

        assertEquals(afterFirstSend, table.get(EMAIL).getRequestCount());
    }

    // ---- Storage ----

    @Test
    void otpIsNeverStoredInPlaintext() {
        otpService.storeOtp(EMAIL, "123456", EXPIRY_MINUTES);

        String stored = table.get(EMAIL).getHashedOtp();
        assertNotEquals("123456", stored);
        assertFalse(stored.contains("123456"));
        assertTrue(stored.startsWith("$2"), "expected a BCrypt hash");
    }
}
