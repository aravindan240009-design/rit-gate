package com.example.visitor.controller;

import com.example.visitor.util.ErrorMessages;
import com.example.visitor.security.Authz;

import com.example.visitor.entity.Event;
import com.example.visitor.entity.EventCoordinator;
import com.example.visitor.entity.EventPass;
import com.example.visitor.repository.EventPassRepository;
import com.example.visitor.repository.StaffRepository;
import com.example.visitor.repository.StudentRepository;
import com.example.visitor.service.EventCsvService;
import com.example.visitor.service.EventCsvService.EventPassRowDTO;
import com.example.visitor.service.EventService;
import com.example.visitor.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
@Slf4j
public class EventController {

    private final EventService eventService;
    private final EventCsvService eventCsvService;
    private final EventPassRepository eventPassRepository;
    private final NotificationService notificationService;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;

    // ── HOD: Create event ──────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> body) {
        try {
            String hodCode  = Authz.selfId(); // act only as yourself (token identity)
            String name     = (String) body.get("eventName");
            String dateStr  = (String) body.get("eventDate");
            String venue    = (String) body.get("venue");

            if (hodCode == null || hodCode.isBlank()) return badRequest("hodCode is required");
            if (name    == null || name.isBlank())    return badRequest("eventName is required");
            if (dateStr == null || dateStr.isBlank()) return badRequest("eventDate is required");
            if (venue   == null || venue.isBlank())   return badRequest("venue is required");

            LocalDate eventDate = LocalDate.parse(dateStr);
            Event event = eventService.createEvent(hodCode, name, eventDate, venue);

            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Event created successfully",
                "eventId", event.getId(),
                "event", eventToMap(event)
            ));
        } catch (IllegalArgumentException e) {
            return badRequest(ErrorMessages.userFriendly(e));
        } catch (Exception e) {
            log.error("Error creating event", e);
            return serverError("Failed to create event: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── HOD: List own events ───────────────────────────────────────────────────

    @GetMapping("/hod/{hodCode}")
    public ResponseEntity<?> getHodEvents(@PathVariable String hodCode) {
        try {
            List<Event> events = eventService.getEventsForHod(hodCode);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "events", events.stream().map(this::eventToMap).collect(Collectors.toList())
            ));
        } catch (Exception e) {
            log.error("Error fetching events for HOD {}", hodCode, e);
            return serverError("Failed to fetch events: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Event Controller: List ALL events ─────────────────────────────────────

    @GetMapping("/all")
    public ResponseEntity<?> getAllEvents() {
        try {
            List<Event> events = eventService.getAllEvents();
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "events", events.stream().map(this::eventToMap).collect(Collectors.toList())
            ));
        } catch (Exception e) {
            log.error("Error fetching all events", e);
            return serverError("Failed to fetch events: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── HOD: Assign coordinators ───────────────────────────────────────────────

    @PostMapping("/{eventId}/coordinators")
    public ResponseEntity<?> assignCoordinators(@PathVariable Long eventId,
                                                @RequestBody Map<String, Object> body) {
        try {
            String hodCode = Authz.selfId(); // act only as yourself (token identity)
            @SuppressWarnings("unchecked")
            List<String> staffCodes = (List<String>) body.get("staffCodes");

            if (hodCode == null || hodCode.isBlank())             return badRequest("hodCode is required");
            if (staffCodes == null || staffCodes.isEmpty())       return badRequest("staffCodes is required");

            List<Map<String, Object>> results = eventService.assignCoordinators(eventId, staffCodes, hodCode);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "assigned", results
            ));
        } catch (Exception e) {
            log.error("Error assigning coordinators to event {}", eventId, e);
            return serverError("Failed to assign coordinators: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── HOD: Remove coordinator ────────────────────────────────────────────────

    @DeleteMapping("/{eventId}/coordinators/{staffCode}")
    public ResponseEntity<?> removeCoordinator(@PathVariable Long eventId,
                                               @PathVariable String staffCode) {
        try {
            eventService.removeCoordinator(eventId, staffCode);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Coordinator removed"));
        } catch (IllegalStateException e) {
            return badRequest(ErrorMessages.userFriendly(e));
        } catch (Exception e) {
            log.error("Error removing coordinator {} from event {}", staffCode, eventId, e);
            return serverError("Failed to remove coordinator: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── HOD: List coordinators ─────────────────────────────────────────────────

    @GetMapping("/{eventId}/coordinators")
    public ResponseEntity<?> getCoordinators(@PathVariable Long eventId) {
        try {
            List<EventCoordinator> coords = eventService.getCoordinatorsForEvent(eventId);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "coordinators", coords.stream().map(this::coordToMap).collect(Collectors.toList())
            ));
        } catch (Exception e) {
            log.error("Error fetching coordinators for event {}", eventId, e);
            return serverError("Failed to fetch coordinators: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Staff: List assigned events ────────────────────────────────────────────

    @GetMapping("/coordinator/{staffCode}")
    public ResponseEntity<?> getStaffEvents(@PathVariable String staffCode) {
        try {
            Authz.requireSelf(staffCode);
            List<Event> events = eventService.getEventsForCoordinator(staffCode);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "events", events.stream().map(this::eventToMap).collect(Collectors.toList())
            ));
        } catch (Exception e) {
            log.error("Error fetching events for coordinator {}", staffCode, e);
            return serverError("Failed to fetch events: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Staff: Preview CSV (parse + validate, no persist) ─────────────────────

    @PostMapping(value = "/{eventId}/csv/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> previewCsv(@PathVariable Long eventId,
                                        @RequestParam("file") MultipartFile file,
                                        @RequestParam("staffCode") String staffCode) {
        try {
            Authz.requireSelf(staffCode);
            if (!eventService.isCoordinator(eventId, staffCode)) {
                return ResponseEntity.status(403).body(Map.of(
                    "status", "ERROR",
                    "message", "You are not an assigned coordinator for this event."
                ));
            }
            if (file == null || file.isEmpty()) return badRequest("No file uploaded.");
            String filename = file.getOriginalFilename();
            if (filename == null) return badRequest("Filename is missing.");

            // Support both .csv and .xlsx
            List<EventPassRowDTO> rows;
            if (filename.toLowerCase().endsWith(".csv")) {
                rows = eventCsvService.parseCsv(file.getBytes());
            } else if (filename.toLowerCase().endsWith(".xlsx")) {
                rows = eventCsvService.parseExcel(file.getBytes());
            } else {
                return badRequest("Only .csv and .xlsx files are accepted.");
            }

            // Validate within-file duplicates + check against DB
            rows = eventCsvService.validateRows(rows);
            rows = eventCsvService.markDbDuplicates(eventId, rows);

            long validCount     = rows.stream().filter(r -> r.valid).count();
            long invalidCount   = rows.stream().filter(r -> !r.valid && !r.duplicate).count();
            long duplicateCount = rows.stream().filter(r -> r.duplicate).count();

            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "rows", rows.stream().map(EventPassRowDTO::toMap).collect(Collectors.toList()),
                "validCount", validCount,
                "invalidCount", invalidCount,
                "duplicateCount", duplicateCount,
                "totalCount", rows.size()
            ));
        } catch (IllegalArgumentException e) {
            return badRequest(ErrorMessages.userFriendly(e));
        } catch (Exception e) {
            log.error("Error previewing file for event {}", eventId, e);
            return serverError("Failed to parse file: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Staff: Confirm upload ──────────────────────────────────────────────────

    @PostMapping("/{eventId}/csv/confirm")
    public ResponseEntity<?> confirmUpload(@PathVariable Long eventId,
                                           @RequestBody Map<String, Object> body) {
        try {
            String staffCode = Authz.selfId(); // act only as yourself (token identity)
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawRows = (List<Map<String, Object>>) body.get("rows");

            if (staffCode == null || staffCode.isBlank()) return badRequest("staffCode is required");
            if (rawRows == null || rawRows.isEmpty())     return badRequest("rows is required");

            if (!eventService.isCoordinator(eventId, staffCode)) {
                return ResponseEntity.status(403).body(Map.of(
                    "status", "ERROR",
                    "message", "You are not an assigned coordinator for this event."
                ));
            }

            // Map raw rows back to DTOs (duplicates are filtered out client-side)
            List<EventPassRowDTO> validRows = new ArrayList<>();
            for (Map<String, Object> raw : rawRows) {
                EventPassRowDTO dto = new EventPassRowDTO();
                dto.fullName    = str(raw.get("fullName"));
                dto.email       = str(raw.get("email"));
                dto.collegeName = str(raw.get("collegeName"));
                dto.phone       = str(raw.get("phone"));
                dto.studentId   = str(raw.get("studentId"));
                dto.department  = str(raw.get("department"));
                dto.course      = str(raw.get("course"));
                dto.valid       = true;
                validRows.add(dto);
            }

            // Re-validate to prevent bypassing the preview
            List<EventPassRowDTO> validated = eventCsvService.validateRows(validRows);
            long invalidCount = validated.stream().filter(r -> !r.valid).count();
            if (invalidCount > 0) {
                return badRequest("Cannot confirm: " + invalidCount + " invalid rows present.");
            }

            Event event = eventService.getEvent(eventId);
            Map<String, Object> result = eventCsvService.confirmUpload(event, validated, staffCode);

            // Notify coordinator
            try {
                int issued = (int) result.get("issued");
                notificationService.notifyCoordinatorOfUploadConfirmation(staffCode, event.getEventName(), issued);
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Event passes generated and emailed.",
                "result", result
            ));
        } catch (Exception e) {
            log.error("Error confirming CSV upload for event {}", eventId, e);
            return serverError("Failed to confirm upload: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Staff: Add a single participant manually ───────────────────────────────

    @PostMapping("/{eventId}/passes/single")
    public ResponseEntity<?> addSinglePass(@PathVariable Long eventId,
                                           @RequestBody Map<String, Object> body) {
        try {
            String staffCode = Authz.selfId();
            if (!eventService.isCoordinator(eventId, staffCode)) {
                return ResponseEntity.status(403).body(Map.of(
                    "status", "ERROR",
                    "message", "You are not an assigned coordinator for this event."
                ));
            }

            EventPassRowDTO row = new EventPassRowDTO();
            row.rowIndex    = 1;
            row.fullName    = str(body.get("fullName"));
            row.email       = str(body.get("email"));
            row.collegeName = str(body.get("collegeName"));
            row.phone       = str(body.get("phone"));
            row.studentId   = str(body.get("studentId"));
            row.department  = str(body.get("department"));
            row.course      = str(body.get("course"));
            row.valid       = true;

            // Validate format
            List<EventPassRowDTO> singleList = eventCsvService.validateRows(List.of(row));
            if (!singleList.get(0).valid) {
                return badRequest("Validation failed: " + singleList.get(0).errorMessage);
            }

            Event event = eventService.getEvent(eventId);
            Map<String, Object> result = eventCsvService.confirmSingle(event, row, staffCode);

            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Pass issued successfully.",
                "result", result
            ));
        } catch (IllegalArgumentException e) {
            return badRequest(ErrorMessages.userFriendly(e));
        } catch (Exception e) {
            log.error("Error adding single pass for event {}", eventId, e);
            return serverError("Failed to add pass: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Staff/HOD: List passes ─────────────────────────────────────────────────

    @GetMapping("/{eventId}/passes")
    public ResponseEntity<?> getEventPasses(@PathVariable Long eventId) {
        try {
            List<EventPass> passes = eventPassRepository.findByEventId(eventId);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "passes", passes.stream().map(this::passToMap).collect(Collectors.toList())
            ));
        } catch (Exception e) {
            log.error("Error fetching passes for event {}", eventId, e);
            return serverError("Failed to fetch passes: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Staff: Download CSV template ───────────────────────────────────────────

    @GetMapping(value = "/csv-template", produces = "text/csv")
    public ResponseEntity<String> downloadTemplate() {
        String csv =
            "full_name,email,college_name,phone,student_id,department,course\r\n" +
            "John Doe,john.doe@example.edu,Example Engineering College,9876543210,EX2024001,Computer Science,B.E. CSE\r\n";
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=\"event_pass_template.csv\"")
            .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
            .body(csv);
    }

    // ── HOD: Complete event ────────────────────────────────────────────────────

    @PutMapping("/{eventId}/complete")
    public ResponseEntity<?> completeEvent(@PathVariable Long eventId,
                                           @RequestBody Map<String, Object> body) {
        try {
            String hodCode = Authz.selfId(); // act only as yourself (token identity)
            if (hodCode == null || hodCode.isBlank()) return badRequest("hodCode is required");
            Event event = eventService.completeEvent(eventId, hodCode);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Event marked as completed",
                "event", eventToMap(event)
            ));
        } catch (IllegalStateException e) {
            return badRequest(ErrorMessages.userFriendly(e));
        } catch (Exception e) {
            log.error("Error completing event {}", eventId, e);
            return serverError("Failed to complete event: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── HOD: Delete event ──────────────────────────────────────────────────────

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId) {
        try {
            String hodCode = Authz.selfId(); // act only as yourself (token identity)
            if (hodCode == null || hodCode.isBlank()) return badRequest("hodCode is required");
            eventService.deleteEvent(eventId, hodCode);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Event deleted"
            ));
        } catch (IllegalStateException e) {
            return badRequest(ErrorMessages.userFriendly(e));
        } catch (Exception e) {
            log.error("Error deleting event {}", eventId, e);
            return serverError("Failed to delete event: " + ErrorMessages.userFriendly(e));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Map<String, Object> eventToMap(Event e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("eventName", e.getEventName());
        m.put("eventDate", e.getEventDate().toString());
        m.put("venue", e.getVenue());
        m.put("status", e.getStatus());
        m.put("createdByHod", e.getCreatedByHod());
        m.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return m;
    }

    private Map<String, Object> coordToMap(EventCoordinator c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("eventId", c.getEventId());
        m.put("staffCode", c.getStaffCode());
        m.put("assignedBy", c.getAssignedBy());
        m.put("assignedAt", c.getAssignedAt() != null ? c.getAssignedAt().toString() : null);
        // Include coordinator name + type for display — the code may be a staff
        // code or a student regNo (students can be coordinators too).
        String code = c.getStaffCode();
        String name;
        String type;
        Optional<String> staffName = staffRepository.findByStaffCode(code).map(s -> s.getStaffName());
        if (staffName.isPresent()) {
            name = staffName.get();
            type = "STAFF";
        } else {
            Optional<String> studentName = studentRepository.findByRegNo(code).map(s -> s.getFirstName());
            name = studentName.orElse(code);
            type = studentName.isPresent() ? "STUDENT" : "UNKNOWN";
        }
        m.put("staffName", name);
        m.put("type", type);
        return m;
    }

    private Map<String, Object> passToMap(EventPass p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("eventId", p.getEventId());
        m.put("fullName", p.getFullName());
        m.put("email", p.getEmail());
        m.put("collegeName", p.getCollegeName());
        m.put("phone", p.getPhone());
        m.put("studentId", p.getStudentId());
        m.put("department", p.getDepartment());
        m.put("course", p.getCourse());
        m.put("status", p.getStatus());
        m.put("manualEntryCode", p.getManualEntryCode());
        m.put("entryScannedAt", p.getEntryScannedAt() != null ? p.getEntryScannedAt().toString() : null);
        m.put("exitScannedAt", p.getExitScannedAt() != null ? p.getExitScannedAt().toString() : null);
        m.put("exitReason", p.getExitReason());
        m.put("qrExpiresAt", p.getQrExpiresAt() != null ? p.getQrExpiresAt().toString() : null);
        return m;
    }

    private ResponseEntity<?> badRequest(String msg) {
        return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", msg));
    }

    private ResponseEntity<?> serverError(String msg) {
        return ResponseEntity.internalServerError().body(Map.of("status", "ERROR", "message", msg));
    }

    private String str(Object o) {
        return o instanceof String s ? (s.isBlank() ? null : s.trim()) : null;
    }
}
