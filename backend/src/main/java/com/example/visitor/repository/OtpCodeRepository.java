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

    // Delete all OTP rows that have passed their expiry — used by the cleanup scheduler.
    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiresAt < :now")
    int deleteExpired(@Param("now") LocalDateTime now);
}
