package com.example.visitor.service;

import com.example.visitor.entity.Event;
import com.example.visitor.entity.EventPass;
import com.example.visitor.entity.QRTable;
import com.example.visitor.repository.EventPassRepository;
import com.example.visitor.repository.QRTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
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
        /** Set to true when the email already has a pass for this event. */
        public boolean duplicate = false;

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
            m.put("duplicate", duplicate);
            m.put("errorMessage", errorMessage);
            return m;
        }
    }

    // ── Parse CSV ──────────────────────────────────────────────────────────────

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
        if (headerLine.startsWith("\uFEFF")) {
            headerLine = headerLine.substring(1);
        }

        String[] headers = splitCsvLine(headerLine);
        Map<String, Integer> colIndex = buildColIndex(headers);
        assertRequiredColumns(colIndex);

        String line;
        int rowNum = 0;
        while ((line = reader.readLine()) != null) {
            if (line.isBlank()) continue;
            rowNum++;
            if (rowNum > MAX_ROWS) {
                throw new IllegalArgumentException("File exceeds maximum of " + MAX_ROWS + " rows.");
            }
            String[] cols = splitCsvLine(line);
            rows.add(buildRow(rowNum, cols, colIndex));
        }

        if (rows.isEmpty()) throw new IllegalArgumentException("File contains no data rows.");
        return rows;
    }

    // ── Parse Excel (.xlsx) ───────────────────────────────────────────────────

    public List<EventPassRowDTO> parseExcel(byte[] excelBytes) throws Exception {
        List<EventPassRowDTO> rows = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null) throw new IllegalArgumentException("Excel file has no sheets.");

            // Find header row (first non-empty row)
            Row headerRow = null;
            for (Row row : sheet) {
                if (row != null && row.getPhysicalNumberOfCells() > 0) { headerRow = row; break; }
            }
            if (headerRow == null) throw new IllegalArgumentException("Excel file is empty or missing header row.");

            Map<String, Integer> colIndex = new HashMap<>();
            for (Cell cell : headerRow) {
                String h = cellString(cell).trim().toLowerCase();
                if (!h.isEmpty()) colIndex.put(h, cell.getColumnIndex());
            }
            assertRequiredColumns(colIndex);

            int rowNum = 0;
            boolean pastHeader = false;
            for (Row row : sheet) {
                if (!pastHeader) { pastHeader = true; continue; } // skip header
                if (row == null) continue;

                // Skip fully empty rows
                boolean allEmpty = true;
                for (Cell c : row) { if (!cellString(c).isBlank()) { allEmpty = false; break; } }
                if (allEmpty) continue;

                rowNum++;
                if (rowNum > MAX_ROWS) {
                    throw new IllegalArgumentException("File exceeds maximum of " + MAX_ROWS + " rows.");
                }

                EventPassRowDTO dto = new EventPassRowDTO();
                dto.rowIndex   = rowNum;
                dto.fullName   = excelCol(row, colIndex, "full_name");
                dto.email      = excelCol(row, colIndex, "email");
                dto.collegeName= excelCol(row, colIndex, "college_name");
                dto.phone      = excelCol(row, colIndex, "phone");
                dto.studentId  = excelCol(row, colIndex, "student_id");
                dto.department = excelCol(row, colIndex, "department");
                dto.course     = excelCol(row, colIndex, "course");
                rows.add(dto);
            }
        }

        if (rows.isEmpty()) throw new IllegalArgumentException("File contains no data rows.");
        return rows;
    }

    // ── Validate (within-file duplicates only) ────────────────────────────────

    public List<EventPassRowDTO> validateRows(List<EventPassRowDTO> rows) {
        Set<String> seenEmails = new LinkedHashSet<>();
        for (EventPassRowDTO row : rows) {
            row.valid = true;
            row.errorMessage = null;
            row.duplicate = false;
            List<String> errors = new ArrayList<>();

            if (row.fullName == null || row.fullName.isBlank())       errors.add("full_name is required");
            if (row.collegeName == null || row.collegeName.isBlank()) errors.add("college_name is required");
            if (row.phone == null || row.phone.isBlank())             errors.add("phone is required");

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

    /**
     * Cross-check rows against passes already issued for this event.
     * Rows whose email already has a pass are flagged valid=false, duplicate=true
     * so the coordinator can see them in the preview (grayed-out) and they are
     * automatically excluded from the confirm step.
     */
    public List<EventPassRowDTO> markDbDuplicates(Long eventId, List<EventPassRowDTO> rows) {
        Set<String> existing = eventPassRepository.findEmailsByEventId(eventId);
        Set<String> existingLower = new HashSet<>();
        for (String e : existing) if (e != null) existingLower.add(e.toLowerCase());

        for (EventPassRowDTO row : rows) {
            if (row.email != null && existingLower.contains(row.email.trim().toLowerCase())) {
                row.valid = false;
                row.duplicate = true;
                row.errorMessage = "Pass already issued for this email";
            }
        }
        return rows;
    }

    // ── Confirm bulk upload ────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> confirmUpload(Event event, List<EventPassRowDTO> validRows, String uploadedBy) {
        // Double-check DB duplicates at confirm time (in case preview was stale)
        Set<String> existing = eventPassRepository.findEmailsByEventId(event.getId());
        Set<String> existingLower = new HashSet<>();
        for (String e : existing) if (e != null) existingLower.add(e.toLowerCase());

        int issued = 0, failed = 0, skipped = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        LocalDateTime expiresAt = expiryForEvent(event);

        for (EventPassRowDTO row : validRows) {
            // Skip rows already in DB (dedup on re-upload)
            if (row.email != null && existingLower.contains(row.email.trim().toLowerCase())) {
                skipped++;
                continue;
            }
            try {
                issued += issueOne(event, row, uploadedBy, expiresAt, errors);
            } catch (Exception e) {
                log.error("Failed to process row {}: {}", row.rowIndex, e.getMessage());
                failed++;
                errors.add(Map.of(
                    "email", row.email != null ? row.email : "",
                    "name",  row.fullName != null ? row.fullName : "",
                    "reason", e.getMessage()
                ));
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total",   validRows.size());
        result.put("issued",  issued);
        result.put("skipped", skipped);
        result.put("failed",  failed);
        result.put("errors",  errors);
        return result;
    }

    // ── Confirm single manual entry ────────────────────────────────────────────

    @Transactional
    public Map<String, Object> confirmSingle(Event event, EventPassRowDTO row, String uploadedBy) {
        String emailKey = row.email != null ? row.email.trim().toLowerCase() : "";
        if (eventPassRepository.existsByEventIdAndEmail(event.getId(), emailKey)) {
            throw new IllegalArgumentException("A pass has already been issued to " + row.email + " for this event.");
        }
        LocalDateTime expiresAt = expiryForEvent(event);
        List<Map<String, Object>> errors = new ArrayList<>();
        int issued = issueOne(event, row, uploadedBy, expiresAt, errors);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total",   1);
        result.put("issued",  issued);
        result.put("skipped", 0);
        result.put("failed",  errors.size());
        result.put("errors",  errors);
        return result;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /** Persist one pass + QR row + send email. Returns 1 on email success, 0 on email failure. */
    private int issueOne(Event event, EventPassRowDTO row,
                         String uploadedBy, LocalDateTime expiresAt,
                         List<Map<String, Object>> errors) {
        String token = generateToken(8);
        String manualCode = generateManualCode();

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

        QRTable qrRow = new QRTable();
        qrRow.setQrString(qrString);
        qrRow.setQrCode(token);
        qrRow.setPassType("EVENT");
        qrRow.setUserType("EV");
        qrRow.setUserId(pass.getId().toString());
        qrRow.setRequestedByStaffCode(uploadedBy);
        qrRow.setStudentCount(1);
        qrRow.setStaffCount(0);
        qrRow.setEntry(token);
        qrRow.setExit(null);
        qrRow.setStatus("ACTIVE");
        qrRow.setManualEntryCode(manualCode);
        qrRow.setQrExpiresAt(expiresAt);
        qrTableRepository.save(qrRow);

        try {
            emailService.sendEventPassEmail(
                pass.getEmail(), pass.getFullName(),
                event.getEventName(), event.getVenue(),
                event.getEventDate().toString(),
                qrString, manualCode
            );
            return 1;
        } catch (Exception emailEx) {
            log.warn("Email failed for {}: {}", pass.getEmail(), emailEx.getMessage());
            pass.setStatus("EMAIL_FAILED");
            eventPassRepository.save(pass);
            errors.add(Map.of(
                "email",  pass.getEmail(),
                "name",   pass.getFullName(),
                "reason", emailEx.getMessage()
            ));
            return 0;
        }
    }

    private LocalDateTime expiryForEvent(Event event) {
        return event.getEventDate()
            .atTime(23, 59, 59)
            .atZone(ZoneId.of("Asia/Kolkata"))
            .toLocalDateTime();
    }

    private Map<String, Integer> buildColIndex(String[] headers) {
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < headers.length; i++) idx.put(headers[i].trim().toLowerCase(), i);
        return idx;
    }

    private void assertRequiredColumns(Map<String, Integer> colIndex) {
        for (String col : new String[]{"full_name", "email", "college_name", "phone"}) {
            if (!colIndex.containsKey(col)) {
                throw new IllegalArgumentException("Missing required column: " + col);
            }
        }
    }

    private EventPassRowDTO buildRow(int rowNum, String[] cols, Map<String, Integer> colIndex) {
        EventPassRowDTO row = new EventPassRowDTO();
        row.rowIndex    = rowNum;
        row.fullName    = getCol(cols, colIndex, "full_name");
        row.email       = getCol(cols, colIndex, "email");
        row.collegeName = getCol(cols, colIndex, "college_name");
        row.phone       = getCol(cols, colIndex, "phone");
        row.studentId   = getCol(cols, colIndex, "student_id");
        row.department  = getCol(cols, colIndex, "department");
        row.course      = getCol(cols, colIndex, "course");
        return row;
    }

    private String getCol(String[] cols, Map<String, Integer> colIndex, String name) {
        Integer idx = colIndex.get(name);
        if (idx == null || idx >= cols.length) return null;
        String val = cols[idx].trim();
        return val.isEmpty() ? null : val;
    }

    private String excelCol(Row row, Map<String, Integer> colIndex, String name) {
        Integer idx = colIndex.get(name);
        if (idx == null) return null;
        Cell cell = row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        String val = cellString(cell).trim();
        return val.isEmpty() ? null : val;
    }

    private String cellString(Cell cell) {
        if (cell == null) return "";
        DataFormatter fmt = new DataFormatter();
        return fmt.formatCellValue(cell);
    }

    private String generateToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TOKEN_CHARS.charAt(SECURE_RANDOM.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }

    private String generateManualCode() {
        return String.format("%06d", 100000 + SECURE_RANDOM.nextInt(900000));
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
