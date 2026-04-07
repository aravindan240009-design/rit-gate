package com.example.visitor.controller;

import com.example.visitor.entity.Visitor;
import com.example.visitor.entity.Staff;
import com.example.visitor.repository.VisitorRepository;
import com.example.visitor.repository.StaffRepository;
import com.example.visitor.service.EmailService;
import com.example.visitor.service.VisitorRequestService;
import com.example.visitor.util.DepartmentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/visitors")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class VisitorController {
    
    @Autowired
    private VisitorRepository visitorRepository;
    
    @Autowired
    private StaffRepository staffRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private VisitorRequestService visitorRequestService;
    
    // Register a new visitor
    @PostMapping
    public ResponseEntity<VisitorRegistrationResponse> registerVisitor(@RequestBody VisitorRegistrationRequest request) {
        try {
            // Create Visitor entity
            Visitor visitor = new Visitor();
            
            // Map form fields to visitor
            visitor.setName(request.getName());
            visitor.setEmail(request.getEmail());
            visitor.setPhone(request.getPhone());
            
            // Convert department name to short code
            String departmentCode = DepartmentMapper.toShortCode(request.getDepartment());
            visitor.setDepartment(departmentCode);
            
            visitor.setPurpose(request.getPurpose());
            visitor.setPersonToMeet(request.getPersonToMeet());
            visitor.setNumberOfPeople(request.getNumberOfPeople() != null ? request.getNumberOfPeople() : 1);
            String visitorRole = request.getRole() != null && !request.getRole().isBlank() ? request.getRole().toUpperCase() : "VISITOR";
            visitor.setRole(visitorRole);
            visitor.setType(visitorRole);
            
            if (request.getVehicleNumber() != null && !request.getVehicleNumber().isEmpty()) {
                visitor.setVehicleNumber(request.getVehicleNumber());
            }
            
            // Set staff code for routing to staff member
            if (request.getStaffCode() != null && !request.getStaffCode().isEmpty()) {
                visitor.setStaffCode(request.getStaffCode());
            }
            
            // Set visit date and time
            if (request.getVisitDate() != null && !request.getVisitDate().isEmpty()) {
                try {
                    visitor.setVisitDate(java.time.LocalDate.parse(request.getVisitDate()));
                } catch (Exception e) {
                    System.err.println("Invalid visit date format: " + request.getVisitDate());
                }
            }
            
            if (request.getVisitTime() != null && !request.getVisitTime().isEmpty()) {
                try {
                    visitor.setVisitTime(java.time.LocalTime.parse(request.getVisitTime()));
                } catch (Exception e) {
                    System.err.println("Invalid visit time format: " + request.getVisitTime());
                }
            }

            // Find staff member by name to get staff ID
            List<Staff> staffList = staffRepository.findAll();
            String staffEmail = null;
            
            System.out.println("🔍 Looking for staff: " + request.getPersonToMeet());
            System.out.println("📋 Total staff in database: " + staffList.size());
            
            for (Staff staff : staffList) {
                String staffName = staff.getStaffName();
                System.out.println("  Checking: " + staffName + " (code: " + staff.getStaffCode() + ")");
                
                if (staffName != null && staffName.equalsIgnoreCase(request.getPersonToMeet().trim())) {
                    staffEmail = staff.getEmail();
                    System.out.println("✅ Found matching staff: " + staffName);
                    break;
                }
            }

            if (staffEmail == null) {
                System.err.println("❌ Staff member not found: " + request.getPersonToMeet());
                System.err.println("Available staff names: " + staffList.stream()
                    .map(s -> s.getStaffName())
                    .limit(10).toList());
                return ResponseEntity.badRequest().build();
            }

            // Set initial status as PENDING
            visitor.setApprovalStatus("PENDING");
            visitor.setEmailStatus("PENDING");
            visitor.setNotificationSentAt(LocalDateTime.now()); // Track when notification was sent
            visitor.setEscalatedToSecurity(false); // Initialize escalation flag
            
            // Do NOT generate QR code yet - only on approval
            visitor.setQrCode(null);

            // Save visitor to database
            Visitor savedVisitor = visitorRepository.save(visitor);

            System.out.println("✅ Visitor registered: " + savedVisitor.getName() + 
                             " - ID: " + savedVisitor.getId());
            System.out.println("Status: PENDING - Waiting for " + request.getPersonToMeet() + " approval");

            // Send approval request email to staff member
            try {
                emailService.sendApprovalRequestEmail(
                    staffEmail,
                    request.getPersonToMeet(),
                    savedVisitor.getName(),
                    savedVisitor.getEmail(),
                    savedVisitor.getPhone(),
                    savedVisitor.getPurpose(),
                    request.getNumberOfPeople(),
                    savedVisitor.getDepartment(),
                    savedVisitor.getId()
                );
            } catch (Exception emailError) {
                System.err.println("⚠️ Email sending failed (visitor still registered): " + emailError.getMessage());
            }

            // Return response
            VisitorRegistrationResponse response = new VisitorRegistrationResponse();
            response.setId(savedVisitor.getId());
            response.setName(savedVisitor.getName());
            response.setEmail(savedVisitor.getEmail());
            response.setDepartment(savedVisitor.getDepartment());
            response.setPersonToMeet(request.getPersonToMeet());
            response.setApprovalStatus("PENDING");
            response.setMessage("Your visit request has been sent to " + request.getPersonToMeet() + 
                              " for approval. You will receive an email with your QR code once approved.");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error registering visitor: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Approve visitor request (via email link)
    @GetMapping("/{id}/approve")
    public ResponseEntity<String> approveVisitor(@PathVariable Long id) {
        try {
            Visitor visitor = visitorRequestService.approveVisitorRequest(id, "STAFF_EMAIL_LINK");
            
            // Send QR code email to visitor
            try {
                emailService.sendVisitorPassEmail(
                    visitor.getEmail(),
                    visitor.getName(),
                    visitor.getQrCode(),
                    visitor.getManualCode(),
                    visitor.getPersonToMeet(),
                    visitor.getDepartment(),
                    visitor.getVisitDate() != null ? visitor.getVisitDate().toString() : "N/A",
                    visitor.getVisitTime() != null ? visitor.getVisitTime().toString() : "N/A"
                );
            } catch (Exception emailError) {
                System.err.println("⚠️ Email sending failed: " + emailError.getMessage());
            }
            
            System.out.println("Visitor approved via email link: " + visitor.getName());
            
            return ResponseEntity.ok(
                "<html><body style='font-family: Arial; text-align: center; padding: 50px;'>" +
                "<h1 style='color: #10b981;'>✓ Visitor Approved</h1>" +
                "<p>The visitor <strong>" + visitor.getName() + "</strong> has been approved.</p>" +
                "<p>QR code has been sent to their email: " + visitor.getEmail() + "</p>" +
                "</body></html>"
            );
        } catch (Exception e) {
            System.err.println("Error approving visitor: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error approving visitor: " + e.getMessage());
        }
    }
    
    // Reject visitor request (via email link)
    @GetMapping("/{id}/reject")
    public ResponseEntity<String> rejectVisitor(@PathVariable Long id) {
        try {
            Visitor visitor = visitorRequestService.rejectVisitorRequest(id, "Rejected by staff");
            
            // Send rejection email to visitor
            try {
                emailService.sendRejectionEmail(
                    visitor.getEmail(),
                    visitor.getName(),
                    visitor.getPersonToMeet()
                );
            } catch (Exception emailError) {
                System.err.println("⚠️ Rejection email failed: " + emailError.getMessage());
            }
            
            System.out.println("Visitor rejected via email link: " + visitor.getName());
            
            return ResponseEntity.ok(
                "<html><body style='font-family: Arial; text-align: center; padding: 50px;'>" +
                "<h1 style='color: #ef4444;'>✗ Visitor Rejected</h1>" +
                "<p>The visit request from <strong>" + visitor.getName() + "</strong> has been declined.</p>" +
                "<p>A notification email has been sent to: " + visitor.getEmail() + "</p>" +
                "</body></html>"
            );
        } catch (Exception e) {
            System.err.println("Error rejecting visitor: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error rejecting visitor: " + e.getMessage());
        }
    }
    
    // Get all visitors
    @GetMapping
    public ResponseEntity<List<Visitor>> getAllVisitors() {
        try {
            List<Visitor> visitors = visitorRepository.findAll();
            return ResponseEntity.ok(visitors);
        } catch (Exception e) {
            System.err.println("Error fetching visitors: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Get visitor by ID
    @GetMapping("/{id}")
    public ResponseEntity<Visitor> getVisitorById(@PathVariable Long id) {
        try {
            Optional<Visitor> visitor = visitorRepository.findById(id);
            return visitor.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error fetching visitor: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Get visitor by QR code
    @GetMapping("/qr/{qrCode}")
    public ResponseEntity<Visitor> getVisitorByQrCode(@PathVariable String qrCode) {
        try {
            Optional<Visitor> visitor = visitorRepository.findByQrCode(qrCode);
            return visitor.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error fetching visitor by QR code: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // NEW: Get visitor requests for staff member
    @GetMapping("/staff/{staffCode}/requests")
    public ResponseEntity<List<VisitorRequestDTO>> getVisitorRequestsForStaff(
            @PathVariable String staffCode,
            @RequestParam(required = false) String status) {
        try {
            System.out.println("📡 Fetching visitor requests for staff: " + staffCode + " (status: " + status + ")");
            
            List<Visitor> visitors;
            if (status != null && !status.isEmpty()) {
                visitors = visitorRequestService.getPendingVisitorRequestsForStaff(staffCode);
            } else {
                visitors = visitorRequestService.getAllVisitorRequestsForStaff(staffCode);
            }
            
            System.out.println("✅ Found " + visitors.size() + " visitor requests for " + staffCode);
            
            List<VisitorRequestDTO> dtos = visitors.stream()
                    .map(this::convertToDTO)
                    .toList();
            
            System.out.println("✅ Converted to " + dtos.size() + " DTOs");
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("❌ Error fetching visitor requests for " + staffCode + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // NEW: Approve visitor request
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveVisitorRequest(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "STAFF") String approvedBy) {
        try {
            Visitor visitor = visitorRequestService.approveVisitorRequest(id, approvedBy);
            
            // Send email with QR code and manual code
            try {
                emailService.sendVisitorPassEmail(
                    visitor.getEmail(), visitor.getName(), visitor.getQrCode(),
                    visitor.getManualCode(), visitor.getPersonToMeet(), visitor.getDepartment(),
                    visitor.getVisitDate() != null ? visitor.getVisitDate().toString() : "N/A",
                    visitor.getVisitTime() != null ? visitor.getVisitTime().toString() : "N/A"
                );
                visitor.setEmailStatus("SENT");
                visitorRepository.save(visitor);
            } catch (Exception emailError) {
                System.err.println("⚠️ Email sending failed: " + emailError.getMessage());
                visitor.setEmailStatus("FAILED");
                visitorRepository.save(visitor);
            }

            try {
                String registeredBy = visitor.getRegisteredBy();
                if (registeredBy != null && !registeredBy.isBlank() && !"WEBSITE".equals(registeredBy)) {
                    visitorRequestService.notifyRegisteredBy(registeredBy, "Visitor Approved",
                        "Visitor " + visitor.getName() + " has been approved by staff.");
                }
            } catch (Exception notifEx) {
                System.err.println("⚠️ Notification to security failed (non-fatal): " + notifEx.getMessage());
            }

            java.util.Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("success", true);
            resp.put("message", "Visitor request approved successfully");
            resp.put("id", visitor.getId());
            resp.put("status", "APPROVED");
            resp.put("qrCode", visitor.getQrCode());
            resp.put("manualCode", visitor.getManualCode());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            System.err.println("Error approving visitor request: " + e.getMessage());
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage() != null ? e.getMessage() : "Failed to approve visitor request");
            return ResponseEntity.status(400).body(err);
        }
    }

    // NEW: Reject visitor request
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectVisitorRequest(
            @PathVariable Long id,
            @RequestBody(required = false) RejectionRequest request) {
        try {
            String reason = (request != null && request.getReason() != null)
                ? request.getReason() : "Rejected by staff";
            Visitor visitor = visitorRequestService.rejectVisitorRequest(id, reason);

            try {
                emailService.sendRejectionEmail(visitor.getEmail(), visitor.getName(), visitor.getPersonToMeet());
            } catch (Exception emailError) {
                System.err.println("⚠️ Rejection email failed: " + emailError.getMessage());
            }

            java.util.Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("success", true);
            resp.put("message", "Visitor request rejected");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            System.err.println("Error rejecting visitor request: " + e.getMessage());
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage() != null ? e.getMessage() : "Failed to reject visitor request");
            return ResponseEntity.status(400).body(err);
        }
    }
    
    // NEW: Resend visitor pass email
    @PostMapping("/{id}/resend-pass")
    public ResponseEntity<String> resendVisitorPass(@PathVariable Long id) {
        try {
            Optional<Visitor> visitorOpt = visitorRepository.findById(id);
            if (!visitorOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Visitor visitor = visitorOpt.get();
            if (!"APPROVED".equals(visitor.getStatus())) {
                return ResponseEntity.badRequest().body("Visitor request is not approved");
            }
            
            emailService.sendVisitorPassEmail(
                visitor.getEmail(),
                visitor.getName(),
                visitor.getQrCode(),
                visitor.getManualCode(),
                visitor.getPersonToMeet(),
                visitor.getDepartment(),
                visitor.getVisitDate() != null ? visitor.getVisitDate().toString() : "N/A",
                visitor.getVisitTime() != null ? visitor.getVisitTime().toString() : "N/A"
            );
            
            visitor.setEmailStatus("RESENT");
            visitorRepository.save(visitor);
            
            return ResponseEntity.ok("Visitor pass email resent successfully");
        } catch (Exception e) {
            System.err.println("Error resending visitor pass: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error resending email");
        }
    }
    
    // Helper method to convert Visitor to DTO
    private VisitorRequestDTO convertToDTO(Visitor visitor) {
        VisitorRequestDTO dto = new VisitorRequestDTO();
        dto.setRequestId(visitor.getId());
        dto.setRequestType("VISITOR");
        dto.setRequesterName(visitor.getName());
        dto.setVisitorEmail(visitor.getEmail());
        dto.setVisitorPhone(visitor.getPhone());
        dto.setPurpose(visitor.getPurpose());
        dto.setDepartment(visitor.getDepartment());
        dto.setPersonToMeet(visitor.getPersonToMeet());
        dto.setRole(visitor.getRole() != null ? visitor.getRole() : "VISITOR");
        dto.setStatus(visitor.getStatus());
        dto.setVisitDate(visitor.getVisitDate() != null ? visitor.getVisitDate().toString() : null);
        dto.setVisitTime(visitor.getVisitTime() != null ? visitor.getVisitTime().toString() : null);
        dto.setCreatedAt(visitor.getCreatedAt());
        dto.setApprovedAt(visitor.getApprovedAt());
        dto.setQrCode(visitor.getQrCode());
        dto.setManualCode(visitor.getManualCode());
        dto.setRegisteredBy(visitor.getRegisteredBy());
        return dto;
    }
    
    // Inner class for request body
    public static class VisitorRegistrationRequest {
        private String name;
        private String email;
        private String phone;
        private String department;
        private String purpose;
        private Integer numberOfPeople;
        private String vehicleNumber;
        private String personToMeet;
        private String staffCode;  // NEW: Staff code for routing
        private String visitDate;  // NEW: Visit date (YYYY-MM-DD)
        private String visitTime;  // NEW: Visit time (HH:MM)
        private String role;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        
        public Integer getNumberOfPeople() { return numberOfPeople; }
        public void setNumberOfPeople(Integer numberOfPeople) { this.numberOfPeople = numberOfPeople; }
        
        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
        
        public String getPersonToMeet() { return personToMeet; }
        public void setPersonToMeet(String personToMeet) { this.personToMeet = personToMeet; }
        
        public String getStaffCode() { return staffCode; }
        public void setStaffCode(String staffCode) { this.staffCode = staffCode; }
        
        public String getVisitDate() { return visitDate; }
        public void setVisitDate(String visitDate) { this.visitDate = visitDate; }
        
        public String getVisitTime() { return visitTime; }
        public void setVisitTime(String visitTime) { this.visitTime = visitTime; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
    
    // Response class for registration
    public static class VisitorRegistrationResponse {
        private Long id;
        private String name;
        private String email;
        private String department;
        private String personToMeet;
        private String approvalStatus;
        private String message;
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public String getPersonToMeet() { return personToMeet; }
        public void setPersonToMeet(String personToMeet) { this.personToMeet = personToMeet; }
        
        public String getApprovalStatus() { return approvalStatus; }
        public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    // DTO for visitor requests
    public static class VisitorRequestDTO {
        private Long requestId;
        private String requestType;
        private String requesterName;
        private String visitorEmail;
        private String visitorPhone;
        private String purpose;
        private String department;
        private String personToMeet;
        private String role;
        private String status;
        private String visitDate;
        private String visitTime;
        private LocalDateTime createdAt;
        private LocalDateTime approvedAt;
        private String qrCode;
        private String manualCode;
        private String registeredBy;
        
        // Getters and Setters
        public Long getRequestId() { return requestId; }
        public void setRequestId(Long requestId) { this.requestId = requestId; }
        
        public String getRequestType() { return requestType; }
        public void setRequestType(String requestType) { this.requestType = requestType; }
        
        public String getRequesterName() { return requesterName; }
        public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
        
        public String getVisitorEmail() { return visitorEmail; }
        public void setVisitorEmail(String visitorEmail) { this.visitorEmail = visitorEmail; }
        
        public String getVisitorPhone() { return visitorPhone; }
        public void setVisitorPhone(String visitorPhone) { this.visitorPhone = visitorPhone; }
        
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public String getPersonToMeet() { return personToMeet; }
        public void setPersonToMeet(String personToMeet) { this.personToMeet = personToMeet; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getVisitDate() { return visitDate; }
        public void setVisitDate(String visitDate) { this.visitDate = visitDate; }
        
        public String getVisitTime() { return visitTime; }
        public void setVisitTime(String visitTime) { this.visitTime = visitTime; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getApprovedAt() { return approvedAt; }
        public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
        
        public String getQrCode() { return qrCode; }
        public void setQrCode(String qrCode) { this.qrCode = qrCode; }
        
        public String getManualCode() { return manualCode; }
        public void setManualCode(String manualCode) { this.manualCode = manualCode; }

        public String getRegisteredBy() { return registeredBy; }
        public void setRegisteredBy(String registeredBy) { this.registeredBy = registeredBy; }
    }
    
    // Response for approval
    public static class VisitorApprovalResponse {
        private Long id;
        private String status;
        private String qrCode;
        private String manualCode;
        private String message;
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getQrCode() { return qrCode; }
        public void setQrCode(String qrCode) { this.qrCode = qrCode; }
        
        public String getManualCode() { return manualCode; }
        public void setManualCode(String manualCode) { this.manualCode = manualCode; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    // Request for rejection
    public static class RejectionRequest {
        private String reason;
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
