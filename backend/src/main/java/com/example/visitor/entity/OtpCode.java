package com.example.visitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Durable OTP storage. Replaces the in-memory ConcurrentHashMaps that used to hold
 * pending OTPs in AuthController — those were wiped whenever the (Render free-tier)
 * instance restarted, leaving users mid-login with "No OTP found".
 *
 * Keyed by email (one active OTP per email at a time). The OTP itself is stored
 * BCrypt-hashed, never in plaintext.
 */
@Entity
@Table(name = "otp_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpCode {

    @Id
    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "hashed_otp", nullable = false)
    private String hashedOtp;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    // Used for OTP-resend rate limiting (independent of expiry)
    @Column(name = "last_request_at")
    private LocalDateTime lastRequestAt;
}
