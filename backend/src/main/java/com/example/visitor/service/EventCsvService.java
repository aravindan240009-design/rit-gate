package com.example.visitor.service;

import com.example.visitor.entity.Event;
import com.example.visitor.entity.EventPass;
import com.example.visitor.entity.QRTable;
import com.example.visitor.repository.EventPassRepository;
import com.example.visitor.repository.QRTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventCsvService {

    private final EventPassRepository eventPassRepository;
    private final QRTableRepository qrTableRepository;
    private final EmailService emailService;

    private static final int MAX_ROWS = 500;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final String TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ── DTO ────────────────────────────────────────────────────────────────────

    public static class EventPassRowDTO {
        public int rowIndex;
        public String fullName;
        public String email;
        public String collegeName;
        public String phone;
        public String studentId;
        public String department;
        public String course;
        public boolean valid = true;
        public String errorMessage;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("rowIndex", rowIndex);
            m.put("fullName", fullName);
            m.put("email", email);
            m.put("collegeName", collegeName);
            m.put("phone", phone);
            m.put("studentId", studentId);
            m.put("department", department);
            m.put("course", course);
            m.put("valid", valid);
            m.put("errorMessage", errorMessage);
            return m;
        }
    }

    // ── Parse ──────────────────────────────────────────────────────────────────

    public List<EventPassRowDTO> parseCsv(byte[] csvBytes) throws Exception {
        List<EventPassRowDTO> rows = new ArrayList<>();

        BufferedReader reader = new BufferedReader(
            new InputStreamReader(new ByteArrayInputStream(csvBytes), StandardCharsets.UTF_8)
        );

        String headerLine = reader.readLine();
        if (headerLine == null || headerLine.isBlank()) {
            throw new IllegalArgumentException("CSV file is empty or missing header row.");
        }

        // Strip UTF-8 BOM if present
        if (headerLine.startsWith("﻿")) {
            headerLine = headerLine.substring(1);
        }

        String[] headers = splitCsvLine(headerLine);
        Map<String, Integer> colIndex = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            colIndex.put(headers[i].trim().toLowerCase(), i);
        }

        // Required columns
        String[] required = {"full_name", "email", "college_name", "phone"};
        for (String col : required) {
            if (!colIndex.containsKey(col)) {
                throw new IllegalArgumentException("Missing required column: " + col);
            }
        }

        String line;
        int rowNum = 0;
        while ((line = reader.readLine()) != null) {
            if (line.isBlank()) continue;
            rowNum++;
            if (rowNum > MAX_ROWS) {
                throw new IllegalArgumentException("CSV exceeds maximum of " + MAX_ROWS + " rows.");
            }

            String[] cols = splitCsvLine(line);
            EventPassRowDTO row = new EventPassRowDTO();
            row.rowIndex = rowNum;
            row.fullName   = getCol(cols, colIndex, "full_name");
            row.email      = getCol(cols, colIndex, "email");
            row.collegeName= getCol(cols, colIndex, "college_name");
            row.phone      = getCol(cols, colIndex, "phone");
            row.studentId  = getCol(cols, colIndex, "student_id");
            row.department = getCol(cols, colIndex, "department");
            row.course     = getCol(cols, colIndex, "course");
            rows.add(row);
        }

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("CSV contains no data rows.");
        }

        return validateRows(rows);
    }

    // ── Validate ───────────────────────────────────────────────────────────────

    public List<EventPassRowDTO> validateRows(List<EventPassRowDTO> rows) {
        Set<String> seenEmails = new LinkedHashSet<>();

        for (EventPassRowDTO row : rows) {
            row.valid = true;
            row.errorMessage = null;
            List<String> errors = new ArrayList<>();

            if (row.fullName == null || row.fullName.isBlank())   errors.add("full_name is required");
            if (row.collegeName == null || row.collegeName.isBlank()) errors.add("college_name is required");
            if (row.phone == null || row.phone.isBlank())         errors.add("phone is required");

            if (row.email == null || row.email.isBlank()) {
                errors.add("email is required");
            } else if (!EMAIL_PATTERN.matcher(row.email.trim()).matches()) {
                errors.add("invalid email format");
            } else if (!seenEmails.add(row.email.trim().toLowerCase())) {
                errors.add("duplicate email in this upload");
            }

            if (!errors.isEmpty()) {
                row.valid = false;
                row.errorMessage = String.join("; ", errors);
            }
        }
        return rows;
    }

    // ── Confirm ────────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> confirmUpload(Event event, List<EventPassRowDTO> validRows, String uploadedBy) {
        LocalDateTime expiresAt = event.getEventDate()
            .atTime(23, 59, 59)
            .atZone(ZoneId.of("Asia/Kolkata"))
            .toLocalDateTime();

        int issued = 0;
        int failed = 0;
        List<Map<String, Object>> errors = new ArrayList<>();

        for (EventPassRowDTO row : validRows) {
            try {
                String token = generateToken(8);
                String manualCode = generateManualCode();

                // Persist EventPass first to get the id
                EventPass pass = new EventPass();
                pass.setEventId(event.getId());
                pass.setFullName(row.fullName.trim());
                pass.setEmail(row.email.trim().toLowerCase());
                pass.setCollegeName(row.collegeName.trim());
                pass.setPhone(row.phone.trim());
                pass.setStudentId(row.studentId);
                pass.setDepartment(row.department);
                pass.setCourse(row.course);
                pass.setQrToken(token);
                pass.setManualEntryCode(manualCode);
                pass.setStatus("ACTIVE");
                pass.setQrExpiresAt(expiresAt);
                pass.setUploadedBy(uploadedBy);
                pass = eventPassRepository.save(pass);

                String qrString = "EV|" + pass.getId() + "|" + token;
                pass.setQrString(qrString);
                eventPassRepository.save(pass);

                // Mirror in QR table so SecurityController.scanQrCodeInternal can find it
                QRTable qrRow = new QRTable();
                qrRow.setQrString(qrString);
                qrRow.setQrCode(token);
                qrRow.setPassType("EVENT");
                qrRow.setUserType("EV");
                qrRow.setUserId(pass.getId().toString());
                qrRow.setRequestedByStaffCode(uploadedBy);
                qrRow.setStudentCount(1);
                qrRow.setStaffCount(0);
                qrRow.setEntry(token);   // entry = token means "not yet entered"
                qrRow.setExit(null);
                qrRow.setStatus("ACTIVE");
                qrRow.setManualEntryCode(manualCode);
                qrRow.setQrExpiresAt(expiresAt);
                qrTableRepository.save(qrRow);

                // Send email
                try {
                    emailService.sendEventPassEmail(
                        pass.getEmail(), pass.getFullName(),
                        event.getEventName(), event.getVenue(),
                        event.getEventDate().toString(),
                        qrString, manualCode
                    );
                    issued++;
                } catch (Exception emailEx) {
                    log.warn("Email failed for {}: {}", pass.getEmail(), emailEx.getMessage());
                    pass.setStatus("EMAIL_FAILED");
                    eventPassRepository.save(pass);
                    failed++;
                    errors.add(Map.of("email", pass.getEmail(), "name", pass.getFullName(), "reason", emailEx.getMessage()));
                }

            } catch (Exception e) {
                log.error("Failed to process row {}: {}", row.rowIndex, e.getMessage());
                failed++;
                errors.add(Map.of("email", row.email != null ? row.email : "", "name", row.fullName != null ? row.fullName : "", "reason", e.getMessage()));
            }
        }

        return Map.of(
            "total", validRows.size(),
            "issued", issued,
            "failed", failed,
            "errors", errors
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String generateToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TOKEN_CHARS.charAt(SECURE_RANDOM.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }

    private String generateManualCode() {
        // 6-char alphanumeric manual code (uppercase)
        return generateToken(6);
    }

    private String getCol(String[] cols, Map<String, Integer> colIndex, String name) {
        Integer idx = colIndex.get(name);
        if (idx == null || idx >= cols.length) return null;
        String val = cols[idx].trim();
        return val.isEmpty() ? null : val;
    }

    private String[] splitCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        tokens.add(current.toString());
        return tokens.toArray(new String[0]);
    }
}
