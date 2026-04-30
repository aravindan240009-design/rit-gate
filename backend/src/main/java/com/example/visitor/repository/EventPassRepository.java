package com.example.visitor.repository;

import com.example.visitor.entity.EventPass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventPassRepository extends JpaRepository<EventPass, Long> {
    List<EventPass> findByEventId(Long eventId);
    Optional<EventPass> findByQrToken(String qrToken);
    Optional<EventPass> findByQrString(String qrString);
    Optional<EventPass> findByManualEntryCode(String manualEntryCode);
    List<EventPass> findByEventIdAndStatus(Long eventId, String status);

    @Query("SELECT ep FROM EventPass ep WHERE ep.status = 'ENTERED' AND ep.qrExpiresAt < :now")
    List<EventPass> findEnteredPassesPastExpiry(LocalDateTime now);

    boolean existsByEventId(Long eventId);
}
