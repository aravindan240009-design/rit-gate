package com.example.visitor.config;

import com.example.visitor.entity.*;
import com.example.visitor.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * Runs at 00:01 IST every day.
 * Auto-exits ALL user types (STUDENT, STAFF, HOD, VISITOR, EVENT) that have an
 * Entry record from the previous day but no corresponding Exit_logs record.
 * This ensures Entry and Exit_logs stay in sync as the single source of truth.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventAutoExitScheduler {

    private final EventPassRepository eventPassRepository;
    private final QRTableRepository qrTableRepository;
    private final RailwayExitLogRepository railwayExitLogRepository;
    private final RailwayEntryRepository railwayEntryRepository;
    private final EventRepository eventRepository;

    // Fires at 00:01:00 IST every day (after QRExpiryScheduler at 00:00:30)
    @Scheduled(cron = "0 1 0 * * *", zone = "Asia/Kolkata")
    public void autoExitAllUsers() {
        log.info("⏰ [AutoExitScheduler] Running midnight auto-exit for all user types...");
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));

        // Yesterday's window: 00:00:00 → 23:59:59
        LocalDate yesterday = now.toLocalDate().minusDays(1);
        LocalDateTime dayStart = yesterday.atStartOfDay();
        LocalDateTime dayEnd   = yesterday.atTime(LocalTime.MAX);

        autoExitEventPasses(now, dayEnd);
        autoExitEntryUsers(dayStart, dayEnd);

        log.info("✅ [AutoExitScheduler] Midnight auto-exit complete.");
    }

    // ── 1. Event passes that entered but never exited ─────────────────────────
    private void autoExitEventPasses(LocalDateTime now, LocalDateTime autoExitTime) {
        try {
            List<EventPass> entered = eventPassRepository.findEnteredPassesPastExpiry(now);
            int count = 0;
            for (EventPass pass : entered) {
                try {
                    // Resolve event name for purpose field
                    String eventName = "Event";
                    try {
                        Optional<Event> evtOpt = eventRepository.findById(pass.getEventId());
                        if (evtOpt.isPresent()) eventName = evtOpt.get().getEventName();
                    } catch (Exception ignored) {}

                    pass.setStatus("EXITED");
                    pass.setExitScannedAt(autoExitTime);
                    pass.setExitReason("AUTO_EXIT");
                    eventPassRepository.save(pass);

                    // Only write Exit_logs if not already present (avoid duplicates)
                    String passIdStr = pass.getId().toString();
                    boolean alreadyExited = railwayExitLogRepository
                        .findByUserIdOrderByExitTimeDesc(passIdStr)
                        .stream()
                        .anyMatch(e -> e.getUserType() != null && e.getUserType().equals("EVENT"));
                    if (!alreadyExited) {
                        RailwayExitLog exitLog = new RailwayExitLog();
                        exitLog.setUserId(passIdStr);
                        exitLog.setUserType("EVENT");
                        exitLog.setExitTime(autoExitTime);
                        exitLog.setVerifiedBy("AUTO_EXIT");
                        exitLog.setLocation("AUTO");
                        exitLog.setQrCode(pass.getQrString());
                        exitLog.setScanLocation("AUTO");
                        exitLog.setAccessGranted(true);
                        exitLog.setPurpose("AUTO_EXIT");
                        exitLog.setPersonName(pass.getFullName());
                        exitLog.setDepartment(pass.getDepartment() != null ? pass.getDepartment() : pass.getCollegeName());
                        exitLog.setPhone(pass.getPhone());
                        exitLog.setEmail(pass.getEmail());
                        railwayExitLogRepository.save(exitLog);
                    }

                    // Clean up QR table row
                    if (pass.getQrString() != null) {
                        qrTableRepository.findByQrString(pass.getQrString())
                            .ifPresent(qrTableRepository::delete);
                    }
                    count++;
                } catch (Exception e) {
                    log.error("❌ Auto-exit failed for event pass {}: {}", pass.getId(), e.getMessage());
                }
            }
            log.info("✅ [AutoExitScheduler] Event passes auto-exited: {}", count);
        } catch (Exception e) {
            log.error("❌ [AutoExitScheduler] Event pass auto-exit error: {}", e.getMessage(), e);
        }
    }

    // ── 2. All other user types: Entry record yesterday, no Exit_logs record ──
    private void autoExitEntryUsers(LocalDateTime dayStart, LocalDateTime dayEnd) {
        try {
            List<RailwayEntry> yesterdayEntries =
                railwayEntryRepository.findByTimestampBetweenOrderByTimestampDesc(dayStart, dayEnd);

            int count = 0;
            for (RailwayEntry entry : yesterdayEntries) {
                String uid   = entry.getUserId();
                String utype = entry.getUserType();
                if (uid == null || uid.isBlank()) continue;

                // Skip EVENT type — handled separately above via EventPass
                if ("EVENT".equalsIgnoreCase(utype)) continue;

                // Check if an exit record already exists for this user on that day
                boolean hasExit = railwayExitLogRepository
                    .findByUserIdOrderByExitTimeDesc(uid)
                    .stream()
                    .anyMatch(ex -> ex.getExitTime() != null
                        && !ex.getExitTime().isBefore(dayStart)
                        && !ex.getExitTime().isAfter(dayEnd));

                if (hasExit) continue;

                RailwayExitLog exitLog = new RailwayExitLog();
                exitLog.setUserId(uid);
                exitLog.setUserType(utype);
                exitLog.setExitTime(dayEnd);          // 23:59:59 of that day
                exitLog.setVerifiedBy("AUTO_EXIT");
                exitLog.setLocation("AUTO");
                exitLog.setScanLocation("AUTO");
                exitLog.setAccessGranted(true);
                exitLog.setPurpose("AUTO_EXIT");
                exitLog.setPersonName(entry.getPersonName());
                exitLog.setDepartment(entry.getDepartment());
                railwayExitLogRepository.save(exitLog);
                count++;
            }
            log.info("✅ [AutoExitScheduler] Other users auto-exited: {}", count);
        } catch (Exception e) {
            log.error("❌ [AutoExitScheduler] Entry-based auto-exit error: {}", e.getMessage(), e);
        }
    }
}
