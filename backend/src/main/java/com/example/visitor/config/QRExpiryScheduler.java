package com.example.visitor.config;

import com.example.visitor.service.GatePassRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs at midnight every day to expire QR codes that were generated on the previous day.
 * Gate passes are valid only on the day they are approved — they expire at 00:00 IST.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class QRExpiryScheduler {

    private final GatePassRequestService gatePassRequestService;

    /**
     * Fires at 00:00:30 every day (30 seconds past midnight to avoid boundary races).
     * Cron: second minute hour day month weekday
     */
    @Scheduled(cron = "30 0 0 * * *")
    public void expireQRCodesAtMidnight() {
        log.info("⏰ [QRExpiryScheduler] Midnight cleanup — expiring today's QR codes...");
        try {
            gatePassRequestService.cleanupExpiredQRCodes();
            log.info("✅ [QRExpiryScheduler] Midnight cleanup complete.");
        } catch (Exception e) {
            log.error("❌ [QRExpiryScheduler] Error during midnight cleanup: {}", e.getMessage(), e);
        }
    }
}
