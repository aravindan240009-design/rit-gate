package com.example.visitor.service;

import com.example.visitor.entity.*;
import com.example.visitor.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class HODBulkGatePassService {

    private final GatePassRequestRepository gatePassRequestRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final HODRepository hodRepository;
    private final QRTableRepository qrTableRepository;
    private final NotificationService notificationService;
    private final DepartmentLookupService departmentLookupService;

    
    // Create HOD bulk gate pass request using unified Gatepass table
    @Transactional
    public Map<String, Object> createBulkGatePassRequest(String hodCode, List<String> studentRegNos,
                                                         List<String> staffCodes, String purpose, String reason,
                                                         LocalDateTime exitDateTime, LocalDateTime returnDateTime,
                                                         Boolean includeHOD, String receiverId, String attachmentUri) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate HOD — look up from departments table
            Optional<HOD> hodOpt = hodRepository.findFirstByHodCode(hodCode);
            if (!hodOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "HOD not found");
                return response;
            }
            
            HOD hodStaff = hodOpt.get();
            String department = hodStaff.getDepartment();
            
            // Validate at least one participant type is selected
            boolean hasStudents = studentRegNos != null && !studentRegNos.isEmpty();
            boolean hasStaff = staffCodes != null && !staffCodes.isEmpty();
            
            if (!hasStudents && !hasStaff) {
                response.put("success", false);
                response.put("message", "No participants selected");
                return response;
            }
            
            // Build eligible members list
            Set<String> eligibleMembers = new HashSet<>();
            if (hasStudents) {
                eligibleMembers.addAll(studentRegNos);
            }
            if (hasStaff) {
                eligibleMembers.addAll(staffCodes);
            }
            
            boolean includeHODFlag = includeHOD != null ? includeHOD : false;
            if (includeHODFlag) {
                eligibleMembers.add(hodCode);
            }
            
            // VALIDATION: If includeHOD = false, receiverId is REQUIRED
            if (!includeHODFlag && (receiverId == null || receiverId.trim().isEmpty())) {
                response.put("success", false);
                response.put("message", "Receiver selection required when HOD is not included");
                return response;
            }
            
            // VALIDATION: If receiverId provided, it must be in eligible members
            if (receiverId != null && !receiverId.trim().isEmpty()) {
                if (!eligibleMembers.contains(receiverId)) {
                    response.put("success", false);
                    response.put("message", "Receiver must be part of the selected group");
                    return response;
                }
            }
            
            // Determine QR owner
            String qrOwnerId;
            if (includeHODFlag) {
                qrOwnerId = hodCode; // QR goes to HOD
            } else {
                qrOwnerId = receiverId; // QR goes to selected receiver
            }
            
            // Validate students if any
            if (hasStudents) {
                for (String regNo : studentRegNos) {
                    Optional<Student> studentOpt = studentRepository.findByRegNo(regNo);
                    if (!studentOpt.isPresent()) {
                        response.put("success", false);
                        response.put("message", "Student not found: " + regNo);
                        return response;
                    }
                }
            }
            
            // Validate staff if any
            if (hasStaff) {
                for (String staffCode : staffCodes) {
                    Optional<Staff> staffOpt = staffRepository.findByStaffCode(staffCode);
                    if (!staffOpt.isPresent()) {
                        response.put("success", false);
                        response.put("message", "Staff not found: " + staffCode);
                        return response;
                    }
                }
            }
            
            // Determine bulk type
            String bulkType = includeHODFlag ? "BULK_INCLUDE_HOD" : "BULK_EXCLUDE_HOD";
            
            // Build student and staff lists for QR generation
            String studentListStr = hasStudents ? String.join(",", studentRegNos) : "";
            String staffListStr = hasStaff ? String.join(",", staffCodes) : "";
            
            // Create gate pass request — HOD bulk passes are DIRECTLY APPROVED, no HR step
            GatePassRequest gatePassRequest = new GatePassRequest();
            gatePassRequest.setRegNo(hodCode);
            gatePassRequest.setRequestedByStaffCode(hodCode);
            gatePassRequest.setRequestedByStaffName(hodStaff.getStaffName());
            gatePassRequest.setStudentName("HOD Bulk Pass - " + eligibleMembers.size() + " participants");
            gatePassRequest.setDepartment(department);
            gatePassRequest.setPassType("BULK");
            gatePassRequest.setBulkType(bulkType);
            gatePassRequest.setIncludeStaff(includeHODFlag);
            gatePassRequest.setQrOwnerId(qrOwnerId);
            gatePassRequest.setReceiverId(receiverId);
            gatePassRequest.setStudentCount(hasStudents ? studentRegNos.size() : 0);
            gatePassRequest.setStudentList(studentListStr);
            gatePassRequest.setStaffList(staffListStr);
            gatePassRequest.setPurpose(purpose);
            gatePassRequest.setReason(reason);
            gatePassRequest.setRequestDate(LocalDateTime.now());
            gatePassRequest.setRequestSubmittedAt(LocalDateTime.now());
            gatePassRequest.setExitDateTime(exitDateTime);
            gatePassRequest.setReturnDateTime(returnDateTime);
            gatePassRequest.setAttachmentUri(attachmentUri);
            // HOD bulk passes skip HR approval — directly APPROVED
            gatePassRequest.setStatus(GatePassRequest.RequestStatus.APPROVED);
            gatePassRequest.setStaffApproval(GatePassRequest.ApprovalStatus.APPROVED);
            gatePassRequest.setHodApproval(GatePassRequest.ApprovalStatus.APPROVED);
            gatePassRequest.setHrApproval(GatePassRequest.ApprovalStatus.APPROVED);
            gatePassRequest.setStaffApprovedBy(hodCode);
            gatePassRequest.setStaffApprovalDate(LocalDateTime.now());
            gatePassRequest.setHodApprovedBy(hodCode);
            gatePassRequest.setHodApprovalDate(LocalDateTime.now());
            gatePassRequest.setHrApprovedBy("AUTO");
            gatePassRequest.setHrApprovalDate(LocalDateTime.now());
            gatePassRequest.setUserType("HOD");
            
            // Save gate pass request
            GatePassRequest savedRequest = gatePassRequestRepository.save(gatePassRequest);
            
            // Generate QR code immediately — no approval needed
            generateBulkPassQRCode(savedRequest);
            gatePassRequestRepository.save(savedRequest); // persist qrCode + manualCode
            
            // Notify participants that the bulk pass QR is ready
            notificationService.notifyBulkParticipants(savedRequest);
            
            response.put("success", true);
            response.put("message", "Bulk gate pass created successfully. QR code is ready.");
            response.put("requestId", savedRequest.getId());
            response.put("qrCode", savedRequest.getQrCode());
            response.put("manualCode", savedRequest.getManualCode());
            response.put("participantCount", eligibleMembers.size());
            response.put("includeHOD", includeHODFlag);
            response.put("studentList", studentListStr);
            response.put("staffList", staffListStr);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error creating HOD bulk gate pass: " + e.getMessage());
            log.error("Error creating HOD bulk gate pass", e);
        }
        
        return response;
    }
    
    // Get HOD bulk gate pass requests
    public List<GatePassRequest> getHODRequests(String hodCode) {
        log.info("Fetching HOD bulk pass requests for: {}", hodCode);
        return gatePassRequestRepository.findByRegNoAndPassTypeOrderByCreatedAtDesc(hodCode, "BULK");
    }
    
    // Get pending HOD bulk pass requests for HR approval
    public List<GatePassRequest> getPendingForHRApproval() {
        log.info("Fetching pending HOD bulk pass requests for HR approval");
        return gatePassRequestRepository.findByUserTypeAndPassTypeAndHrApprovalOrderByCreatedAtDesc(
            "HOD", "BULK", GatePassRequest.ApprovalStatus.PENDING);
    }
    
    // Get HOD bulk pass details
    public Map<String, Object> getBulkGatePassDetails(Long requestId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<GatePassRequest> requestOpt = gatePassRequestRepository.findById(requestId);
            if (!requestOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Gate pass request not found");
                return response;
            }
            
            GatePassRequest request = requestOpt.get();
            
            // Get participant details from student_list and staff_list
            List<Map<String, String>> participants = new ArrayList<>();
            
            // Add requester if they included themselves
            if (request.getIncludeStaff() != null && request.getIncludeStaff()) {
                String requesterCode = request.getRequestedByStaffCode() != null ? 
                                       request.getRequestedByStaffCode() : request.getRegNo();
                log.info("Including HOD as participant: {}", requesterCode);
                
                Optional<Staff> hodAsStaff = staffRepository.findByStaffCode(requesterCode);
                if (hodAsStaff.isPresent()) {
                    Staff staff = hodAsStaff.get();
                    Map<String, String> info = new HashMap<>();
                    info.put("id", staff.getStaffCode());
                    info.put("name", staff.getStaffName());
                    info.put("type", "hod");
                    info.put("department", staff.getDepartment());
                    participants.add(info);
                }
            }
            
            // Add students
            if (request.getStudentList() != null && !request.getStudentList().isEmpty()) {
                String[] studentRegNos = request.getStudentList().split(",");
                for (String regNo : studentRegNos) {
                    Optional<Student> studentOpt = studentRepository.findByRegNo(regNo.trim());
                    if (studentOpt.isPresent()) {
                        Student student = studentOpt.get();
                        Map<String, String> info = new HashMap<>();
                        info.put("id", student.getRegNo());
                        info.put("name", student.getFullName());
                        info.put("type", "student");
                        info.put("department", student.getDepartment());
                        participants.add(info);
                    }
                }
            }
            
            // Add staff
            if (request.getStaffList() != null && !request.getStaffList().isEmpty()) {
                String requesterCode = request.getRequestedByStaffCode() != null ? 
                                       request.getRequestedByStaffCode() : request.getRegNo();
                
                String[] staffCodesArray = request.getStaffList().split(",");
                log.info("Processing staffList for request {}: '{}'", request.getId(), request.getStaffList());
                for (String code : staffCodesArray) {
                    String trimmedCode = code.trim();
                    if (trimmedCode.isEmpty()) continue;
                    
                    // Skip if already added as requester (HOD included themselves)
                    if (request.getIncludeStaff() != null && request.getIncludeStaff() && 
                        trimmedCode.equalsIgnoreCase(requesterCode)) {
                        continue;
                    }

                    // All participants (including HODs) are in the staff table
                    Optional<Staff> staffOpt = staffRepository.findByStaffCode(trimmedCode);
                    if (staffOpt.isPresent()) {
                        Staff staff = staffOpt.get();
                        Map<String, String> info = new HashMap<>();
                        info.put("id", staff.getStaffCode());
                        info.put("name", staff.getStaffName());
                        info.put("type", "staff");
                        info.put("department", staff.getDepartment());
                        participants.add(info);
                        log.info("Added staff participant: {} - {}", staff.getStaffCode(), staff.getStaffName());
                    } else {
                        log.warn("Staff not found for code: {}", trimmedCode);
                    }
                }
            }
            
            // Build response
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("id", request.getId());
            requestData.put("passType", request.getPassType());
            requestData.put("hodCode", request.getRegNo());
            requestData.put("hodName", request.getRequestedByStaffName());
            requestData.put("department", request.getDepartment());
            requestData.put("purpose", request.getPurpose());
            requestData.put("reason", request.getReason());
            requestData.put("exitDateTime", request.getExitDateTime());
            requestData.put("returnDateTime", request.getReturnDateTime());
            requestData.put("status", request.getStatus());
            requestData.put("hrApproval", request.getHrApproval());
            requestData.put("includeHOD", request.getIncludeStaff()); // Using includeStaff field
            requestData.put("receiverId", request.getReceiverId());
            requestData.put("qrOwnerId", request.getQrOwnerId());
            requestData.put("participantCount", participants.size());
            requestData.put("participants", participants);
            requestData.put("qrCode", request.getQrCode());
            requestData.put("createdAt", request.getCreatedAt());
            requestData.put("attachmentUri", request.getAttachmentUri());
            requestData.put("hrRemark", request.getRejectionReason());
            
            // Fetch manual entry code from QRTable
            List<QRTable> qrList = qrTableRepository.findByPassRequestId(request.getId());
            if (!qrList.isEmpty()) {
                requestData.put("manualCode", qrList.get(0).getManualEntryCode());
            }
            
            response.put("success", true);
            response.put("request", requestData);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching gate pass details: " + e.getMessage());
            log.error("Error fetching gate pass details", e);
        }
        
        return response;
    }
    
    // Generate QR code for bulk pass immediately upon creation
    private void generateBulkPassQRCode(GatePassRequest request) {
        String token = generateUniqueToken();
        String studentList = request.getStudentList() != null ? request.getStudentList() : "";
        String staffList = request.getStaffList() != null ? request.getStaffList() : "";
        String subtype = Boolean.TRUE.equals(request.getIncludeStaff()) ? "SIG" : "SEG";

        String qrString = String.format("GP|%s|%s|%s|%s:%s",
            request.getRequestedByStaffCode(),
            studentList,
            staffList,
            subtype,
            token
        );

        QRTable qrTable = new QRTable();
        qrTable.setPassRequestId(request.getId());
        qrTable.setRequestedByStaffCode(request.getRequestedByStaffCode());
        qrTable.setQrString(qrString);
        qrTable.setManualEntryCode(generateManualCode());
        qrTable.setPassType("BULK");
        qrTable.setIncludeStaff(request.getIncludeStaff());
        qrTable.setStudentCount(request.getStudentCount() != null ? request.getStudentCount() : 0);
        qrTable.setStaffCount(0);
        qrTable.setStatus("ACTIVE");
        qrTable.setUserType("GP");
        qrTable.setUserId(request.getQrOwnerId() != null ? request.getQrOwnerId() : request.getRequestedByStaffCode());
        qrTable.setQrCode(token);
        qrTable.setGroupType(subtype);
        qrTable.setEntry(null);
        qrTable.setExit(token);
        qrTable.setCreatedAt(LocalDateTime.now());
        qrTable.setUpdatedAt(LocalDateTime.now());

        qrTableRepository.save(qrTable);

        request.setQrCode(qrString);
        request.setManualCode(qrTable.getManualEntryCode());
        request.setQrCodeGeneratedAt(LocalDateTime.now());

        log.info("✅ QR generated for HOD bulk pass {} — manual: {}", request.getId(), qrTable.getManualEntryCode());
    }

    private String generateUniqueToken() {
        String token;
        do { token = generateRandomToken(); }
        while (qrTableRepository.findByToken(token).isPresent());
        return token;
    }

    private String generateRandomToken() {
        StringBuilder sb = new StringBuilder(8);
        SecureRandom random = new SecureRandom();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (int i = 0; i < 8; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }

    private String generateManualCode() {
        return String.format("%06d", new SecureRandom().nextInt(1000000));
    }

    // Helper: Find active HR — delegated to DepartmentLookupService
    private String findActiveHR() {
        return departmentLookupService.findActiveHR();
    }
}
