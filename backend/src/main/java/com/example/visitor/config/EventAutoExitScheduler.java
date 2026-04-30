package com.example.visitor.config;

import com.example.visitor.entity.EventPass;
import com.example.visitor.entity.RailwayExitLog;
import com.example.visitor.repository.EventPassRepository;
import com.example.visitor.repository.QRTableRepository;
import com.example.visitor.repository.RailwayExitLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventAutoExitScheduler {

    private final EventPassRepository eventPassRepository;
    private final QRTableRepository qrTableRepository;
    private final RailwayExitLogRepository railwayExitLogRepository;

    // Fires at 00:01:00 IST every day (after QRExpiryScheduler at 00:00:30)
    @Scheduled(cron = "0 1 0 * * *", zone = "Asia/Kolkata")
    public void autoExitEventStudents() {
        log.info("⏰ [EventAutoExitScheduler] Running auto-exit for event passes...");
        try {
            LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
            List<EventPass> entered = eventPassRepository.findEnteredPassesPastExpiry(now);
            int count = 0;
            for (EventPass pass : entered) {
                try {
                    LocalDateTime autoExitTime = pass.getQrExpiresAt(); // 23:59:59 of event date

                    pass.setStatus("EXITED");
                    pass.setExitScannedAt(autoExitTime);
                    pass.setExitReason("AUTO_EXIT");
                    eventPassRepository.save(pass);

                    // Write exit log
                    RailwayExitLog exitLog = new RailwayExitLog();
                    exitLog.setUserId(pass.getId().toString());
                    exitLog.setUserType("EVENT");
                    exitLog.setExitTime(autoExitTime);
                    exitLog.setVerifiedBy("AUTO_EXIT");
                    exitLog.setLocation("AUTO");
                    exitLog.setQrCode(pass.getQrString());
                    exitLog.setScanLocation("AUTO");
                    exitLog.setAccessGranted(true);
                    exitLog.setPurpose("AUTO_EXIT");
                    railwayExitLogRepository.save(exitLog);

                    // Clean up QR table row
                    if (pass.getQrString() != null) {
                        qrTableRepository.findByQrString(pass.getQrString())
                            .ifPresent(qrTableRepository::delete);
                    }
                    count++;
                } catch (Exception e) {
                    log.error("❌ Auto-exit failed for pass {}: {}", pass.getId(), e.getMessage());
                }
            }
            log.info("✅ [EventAutoExitScheduler] Auto-exit complete — {} passes processed.", count);
        } catch (Exception e) {
            log.error("❌ [EventAutoExitScheduler] Scheduler error: {}", e.getMessage(), e);
        }
    }
}
