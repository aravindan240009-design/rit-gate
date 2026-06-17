package com.example.visitor.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues and validates the long-lived (30-day) JWTs that authenticate every API call.
 *
 * The signing secret comes from the JWT_SECRET env var in production (never committed).
 * The default below is for LOCAL DEV ONLY — production MUST set JWT_SECRET.
 */
@Service
public class JwtService {

    @Value("${jwt.secret:dev-only-insecure-secret-change-me-in-production-0123456789abcdef}")
    private String secret;

    @Value("${jwt.expiration-days:30}")
    private long expirationDays;

    private SecretKey key;

    @PostConstruct
    void init() {
        // HS256 requires a >= 256-bit key. Pad short dev secrets so startup never fails,
        // but a real JWT_SECRET should be a long random string.
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    /** Mint a signed token for a verified user. role is e.g. STUDENT/STAFF/HOD/HR/SECURITY/ADMIN. */
    public String issue(String userId, String role) {
        long now = System.currentTimeMillis();
        long expMs = now + expirationDays * 24L * 60L * 60L * 1000L;
        return Jwts.builder()
            .subject(userId)
            .claim("role", role)
            .issuedAt(new Date(now))
            .expiration(new Date(expMs))
            .signWith(key)
            .compact();
    }

    /** Parse + verify signature/expiry. Throws if invalid. */
    public Jws<Claims> parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }

    public String getUserId(String token) {
        return parse(token).getPayload().getSubject();
    }

    public String getRole(String token) {
        Object r = parse(token).getPayload().get("role");
        return r != null ? r.toString() : null;
    }
}
