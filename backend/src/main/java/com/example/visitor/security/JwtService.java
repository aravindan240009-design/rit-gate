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

    /**
     * When true (the default), the app refuses to start with the built-in dev
     * secret. Set app.allow-insecure-jwt-secret=true only for local development.
     */
    @Value("${app.allow-insecure-jwt-secret:false}")
    private boolean allowInsecureSecret;

    static final String DEV_SECRET =
        "dev-only-insecure-secret-change-me-in-production-0123456789abcdef";

    private SecretKey key;

    @PostConstruct
    void init() {
        // Fail fast rather than silently signing tokens with a publicly-known key:
        // anyone with this repo could otherwise mint a valid ADMIN token.
        boolean usingDevSecret = DEV_SECRET.equals(secret) || secret == null || secret.isBlank();
        if (usingDevSecret && !allowInsecureSecret) {
            throw new IllegalStateException(
                "JWT_SECRET is not set. Refusing to start with the built-in development secret — "
                + "set the JWT_SECRET environment variable to a long random string. "
                + "(For local development only, set app.allow-insecure-jwt-secret=true.)");
        }

        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            // HS256 needs a >= 256-bit key. Only reachable in explicitly-allowed dev mode.
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    /** Mint a signed token for a verified user. role is e.g. STUDENT/STAFF/HOD/HR/SECURITY/ADMIN. */
    public String issue(String userId, String role) {
        return issue(userId, role, expirationDays * 24L * 60L * 60L * 1000L);
    }

    /** Mint a signed token with an explicit time-to-live (ms). Used for short-lived scoped tokens. */
    public String issue(String userId, String role, long ttlMillis) {
        long now = System.currentTimeMillis();
        long expMs = now + ttlMillis;
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
