package com.example.visitor.repository;

import com.example.visitor.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, String> {

    /**
     * Purge spent OTP rows — used by the cleanup scheduler.
     *
     * A row is only removable once it can no longer influence throttling:
     * the code has expired AND no lockout is active AND the burst window has
     * aged out. Deleting on expiry alone would hand back a fresh set of
     * resend attempts and reset any active lockout.
     */
    @Modifying
    @Query("""
           DELETE FROM OtpCode o
           WHERE o.expiresAt < :now
             AND (o.lockedUntil IS NULL OR o.lockedUntil < :now)
             AND (o.windowStartedAt IS NULL OR o.windowStartedAt < :windowCutoff)
           """)
    int deleteExpired(@Param("now") LocalDateTime now,
                      @Param("windowCutoff") LocalDateTime windowCutoff);
}
