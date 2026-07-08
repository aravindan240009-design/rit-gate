package com.example.visitor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Email service using Brevo HTTP API (port 443 — never blocked by Render).
 * Replaces JavaMailSender which uses SMTP (ports 587/465 — blocked on Render free tier).
 */
@Service
public class EmailService {

    @Value("${backend.base.url:http://localhost:8080}")
    private String backendBaseUrl;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:uixydhvbxdjk850@gmail.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:RIT Gate}")
    private String senderName;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate = new RestTemplate();

    // ─── core send ────────────────────────────────────────────────────────────

    private void sendEmail(String toEmail, String toName, String subject, String textBody) {
        sendEmail(toEmail, toName, subject, textBody, null);
    }

    private void sendEmail(String toEmail, String toName, String subject, String textBody, String htmlBody) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            System.out.println("⚠️ BREVO_API_KEY not configured — skipping email to " + toEmail);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", Map.of("name", senderName, "email", senderEmail));
        payload.put("to", List.of(Map.of("email", toEmail, "name", toName != null ? toName : toEmail)));
        payload.put("subject", subject);
        payload.put("textContent", textBody);
        if (htmlBody != null && !htmlBody.isBlank()) {
            payload.put("htmlContent", htmlBody);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Email sent via Brevo API to: " + toEmail);
            } else {
                System.err.println("❌ Brevo API returned " + response.getStatusCode() + ": " + response.getBody());
                throw new RuntimeException("Brevo API error: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Brevo HTTP error sending to " + toEmail + ": " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    // ─── public methods ───────────────────────────────────────────────────────

    public void sendOTP(String email, String otp, String userName) {
        // Unique subject per send — prevents Gmail/mail clients from threading all OTP
        // emails together and hiding the newest one. Uses the request time (NOT the OTP
        // digits) so the code is never exposed in subject lines / notification previews.
        String stamp = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"))
            .format(DateTimeFormatter.ofPattern("h:mm a"));
        String subject = "Your RIT Gate Login Code (" + stamp + ")";
        String textBody =
            "Dear " + userName + ",\n\n" +
            "Your One-Time Password (OTP) for login is:\n\n" +
            ">>> " + otp + " <<<\n\n" +
            "This OTP is valid for 5 minutes.\n" +
            "Please do not share this OTP with anyone.\n\n" +
            "If you did not request this OTP, please ignore this email.\n\n" +
            "Best regards,\nRIT Gate Visitor Management System";

        String requestedAt = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"))
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a 'IST'"));

        String safeName = escapeHtml(userName != null ? userName : "User");
        String safeOtp = escapeHtml(otp != null ? otp : "");

        String htmlBody =
            "<!DOCTYPE html>" +
            "<html><body style=\"margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;\">" +
            "<tr><td style=\"background:#172b4d;padding:20px 24px;\">" +
            "<div style=\"font-size:22px;line-height:1.2;color:#ffffff;font-weight:800;\">Your Login Code</div>" +
            "</td></tr>" +
            "<tr><td style=\"padding:26px 24px 22px 24px;color:#1f2937;\">" +
            "<div style=\"font-size:16px;line-height:1.45;color:#111827;font-weight:700;margin-bottom:10px;\">Hi " + safeName + ",</div>" +
            "<div style=\"font-size:16px;line-height:1.55;color:#374151;margin-bottom:18px;\">Use the code below to sign in to your RIT Gate account. This code is valid for <b>5 minutes</b>.</div>" +
            "<div style=\"max-width:360px;margin:0 auto 18px auto;border:2px solid #e5e7eb;border-radius:14px;padding:16px 16px;text-align:center;\">" +
            "<div style=\"font-size:56px;line-height:1;font-weight:900;letter-spacing:12px;color:#111827;\">" + safeOtp + "</div>" +
            "</div>" +
            "<div style=\"font-size:13px;line-height:1.5;color:#6b7280;margin-bottom:8px;\">If you didn't request this code, you can safely ignore this email.</div>" +
            "<div style=\"font-size:12px;color:#9ca3af;font-weight:600;\">Requested at: " + requestedAt + "</div>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table></body></html>";

        sendEmail(email, userName, subject, textBody, htmlBody);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    /**
     * Notify-only — no approve/reject links. A GET link with no auth would let anyone
     * (including email-client link-scanners that prefetch URLs) silently approve/reject
     * the visitor. Approval/rejection happens in the app instead.
     */
    public void sendApprovalRequestEmail(String staffEmail, String staffName, String visitorName,
                                         String visitorEmail, String visitorPhone, String purpose,
                                         Integer numberOfPeople, String department, Long visitorId) {
        String subject = "New Visitor Request - " + visitorName;
        String body =
            "Dear " + staffName + ",\n\n" +
            "You have a new visitor request:\n\n" +
            "Visitor Details:\n" +
            "Name: " + visitorName + "\nEmail: " + visitorEmail + "\nPhone: " + visitorPhone +
            "\nNumber of People: " + numberOfPeople + "\nDepartment: " + department +
            "\nPurpose: " + purpose + "\n\n" +
            "Please open the RIT Gate app to approve or reject this request.\n\n" +
            "Best regards,\nRIT Gate Visitor Management System";
        sendEmail(staffEmail, staffName, subject, body);
    }

    public void sendQRCodeEmail(String visitorEmail, String visitorName, String qrCode,
                                String personToMeet, String department) {
        String subject = "Your Visitor Pass - RIT Gate";
        String body =
            "Dear " + visitorName + ",\n\n" +
            "Your visit request has been approved by " + personToMeet + "!\n\n" +
            "QR Code: " + qrCode + "\nPerson to Meet: " + personToMeet +
            "\nDepartment: " + department + "\n\n" +
            "Please show this QR code at the gate for entry.\n\n" +
            "Best regards,\nRIT Gate Visitor Management System";
        sendEmail(visitorEmail, visitorName, subject, body);
    }

    public void sendRejectionEmail(String visitorEmail, String visitorName, String personToMeet) {
        String subject = "Visit Request Update - RIT Gate";
        String body =
            "Dear " + visitorName + ",\n\n" +
            "We regret to inform you that your visit request to meet " + personToMeet +
            " has been declined.\n\n" +
            "Please contact " + personToMeet + " directly for more information.\n\n" +
            "Best regards,\nRIT Gate Visitor Management System";
        sendEmail(visitorEmail, visitorName, subject, body);
    }

    public void sendVisitorPassEmail(String visitorEmail, String visitorName, String qrCode,
                                     String manualCode, String personToMeet, String department,
                                     String visitDate, String visitTime) {
        String subject = "Your Visitor Gate Pass – Approved";
        String body =
            "Dear " + visitorName + ",\n\n" +
            "Your visit request has been APPROVED!\n\n" +
            "Visitor Name: " + visitorName + "\nPerson to Meet: " + personToMeet +
            "\nDepartment: " + department + "\nVisit Date: " + visitDate +
            "\nVisit Time: " + visitTime + "\n\n" +
            "QR CODE: " + qrCode + "\n\n" +
            "MANUAL ENTRY CODE: " + manualCode + "\n\n" +
            "Show this email at the security gate.\n\n" +
            "Best regards,\nRIT Gate Visitor Management System";
        sendEmail(visitorEmail, visitorName, subject, body);
    }

    public void sendEventPassEmail(String toEmail, String toName, String eventName, String venue,
                                   String eventDate, String qrString, String manualCode) {
        String subject = "Your Event Gate Pass – " + eventName;

        String textBody =
            "Dear " + toName + ",\n\n" +
            "You have been registered as a participant for the following event at RIT Chennai:\n\n" +
            "Event: " + eventName + "\n" +
            "Date: " + eventDate + "\n" +
            "Venue: " + (venue != null ? venue : "RIT Chennai") + "\n\n" +
            "QR CODE: " + qrString + "\n" +
            "MANUAL ENTRY CODE: " + manualCode + "\n\n" +
            "Please show this QR code (or the manual code) at the RIT gate for entry.\n\n" +
            "Best regards,\nRIT Gate – Visitor Management System";

        String safeName    = escapeHtml(toName != null ? toName : "Participant");
        String safeEvent   = escapeHtml(eventName);
        String safeVenue   = escapeHtml(venue != null ? venue : "RIT Chennai");
        String safeDate    = escapeHtml(eventDate);
        String safeQr      = escapeHtml(qrString);
        String safeManual  = escapeHtml(manualCode);

        String htmlBody =
            "<!DOCTYPE html>" +
            "<html><body style=\"margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;\">" +
            "<tr><td style=\"background:#172b4d;padding:20px 24px;\">" +
            "<div style=\"font-size:22px;color:#ffffff;font-weight:800;\">Your Event Gate Pass</div>" +
            "</td></tr>" +
            "<tr><td style=\"padding:26px 24px 22px 24px;color:#1f2937;\">" +
            "<div style=\"font-size:16px;font-weight:700;margin-bottom:10px;\">Hi " + safeName + ",</div>" +
            "<div style=\"font-size:15px;line-height:1.6;color:#374151;margin-bottom:18px;\">You have been registered for the following event at <b>RIT Chennai</b>. Please present the QR code or manual code at the gate for entry.</div>" +
            "<table style=\"width:100%;border-collapse:collapse;margin-bottom:20px;\">" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:35%;\">Event</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + safeEvent + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Date</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + safeDate + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Venue</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + safeVenue + "</td></tr>" +
            "</table>" +
            "<div style=\"background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;\">" +
            "<div style=\"font-size:12px;font-weight:700;color:#374151;margin-bottom:12px;letter-spacing:1px;\">YOUR QR CODE</div>" +
            "<img src=\"https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=20&data=" + java.net.URLEncoder.encode(qrString, java.nio.charset.StandardCharsets.UTF_8) + "\" " +
            "alt=\"QR Code\" width=\"200\" height=\"200\" style=\"display:block;margin:0 auto;\" />" +
            "</div>" +
            "<div style=\"background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:14px;text-align:center;\">" +
            "<div style=\"font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;letter-spacing:1px;\">MANUAL ENTRY CODE</div>" +
            "<div style=\"font-size:32px;font-weight:900;letter-spacing:8px;color:#111827;\">" + safeManual + "</div>" +
            "</div>" +
            "<div style=\"font-size:13px;color:#6b7280;margin-top:16px;\">Show this email or the QR code at the RIT gate. The code expires at midnight on the event date.</div>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table></body></html>";

        sendEmail(toEmail, toName, subject, textBody, htmlBody);
    }

    public void sendCoordinatorAssignmentEmail(String toEmail, String toName, String eventName,
                                               String eventDate, String venue) {
        String subject = "You've been assigned as Event Coordinator – " + eventName;

        String safeVenue = venue != null && !venue.isBlank() ? venue : "TBD";

        String textBody =
            "Dear " + toName + ",\n\n" +
            "You have been assigned as an Event Coordinator for the following event at RIT Chennai:\n\n" +
            "Event: " + eventName + "\n" +
            "Date: " + eventDate + "\n" +
            "Venue: " + safeVenue + "\n\n" +
            "Please open the RIT Gate app to upload the participant CSV for this event.\n\n" +
            "Best regards,\nRIT Gate – Visitor Management System";

        String sName  = escapeHtml(toName != null ? toName : "Coordinator");
        String sEvent = escapeHtml(eventName);
        String sDate  = escapeHtml(eventDate);
        String sVenue = escapeHtml(safeVenue);

        String htmlBody =
            "<!DOCTYPE html>" +
            "<html><body style=\"margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;\">" +
            "<tr><td style=\"background:#172b4d;padding:20px 24px;\">" +
            "<div style=\"font-size:22px;color:#ffffff;font-weight:800;\">Event Coordinator Assignment</div>" +
            "</td></tr>" +
            "<tr><td style=\"padding:26px 24px 22px 24px;color:#1f2937;\">" +
            "<div style=\"font-size:16px;font-weight:700;margin-bottom:10px;\">Hi " + sName + ",</div>" +
            "<div style=\"font-size:15px;line-height:1.6;color:#374151;margin-bottom:18px;\">You have been assigned as an <b>Event Coordinator</b> for the event below. Please open the RIT Gate app to upload the participant CSV.</div>" +
            "<table style=\"width:100%;border-collapse:collapse;margin-bottom:8px;\">" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:35%;\">Event</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sEvent + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Date</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sDate + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Venue</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sVenue + "</td></tr>" +
            "</table>" +
            "<div style=\"font-size:13px;color:#6b7280;margin-top:16px;\">Open the RIT Gate app → Events to manage this assignment.</div>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table></body></html>";

        sendEmail(toEmail, toName, subject, textBody, htmlBody);
    }

    public void sendGatePassStatusEmail(String toEmail, String toName, String statusLabel,
                                        String purpose, String detailMessage) {
        String subject = "Gate Pass Update: " + statusLabel + " — RIT Gate";
        String body =
            "Dear " + toName + ",\n\n" +
            detailMessage + "\n\n" +
            "Purpose: " + (purpose != null ? purpose : "N/A") + "\n\n" +
            "Open the RIT Gate app to view your request status.\n\n" +
            "Best regards,\nRIT Gate Visitor Management System";
        sendEmail(toEmail, toName, subject, body);
    }

    /** Notify a coordinator that an event they were assigned to has been cancelled/removed. */
    public void sendEventCancellationEmail(String toEmail, String toName, String eventName,
                                           String eventDate) {
        String subject = "Event Cancelled – " + eventName;

        String safeDate = eventDate != null && !eventDate.isBlank() ? eventDate : "TBD";

        String textBody =
            "Dear " + toName + ",\n\n" +
            "The following event at RIT Chennai has been cancelled by the HOD. " +
            "You are no longer a coordinator for it and any passes issued for it have been removed:\n\n" +
            "Event: " + eventName + "\n" +
            "Date: " + safeDate + "\n\n" +
            "No further action is needed on your part.\n\n" +
            "Best regards,\nRIT Gate – Visitor Management System";

        String sName  = escapeHtml(toName != null ? toName : "Coordinator");
        String sEvent = escapeHtml(eventName);
        String sDate  = escapeHtml(safeDate);

        String htmlBody =
            "<!DOCTYPE html>" +
            "<html><body style=\"margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;\">" +
            "<tr><td style=\"background:#991b1b;padding:20px 24px;\">" +
            "<div style=\"font-size:22px;color:#ffffff;font-weight:800;\">Event Cancelled</div>" +
            "</td></tr>" +
            "<tr><td style=\"padding:26px 24px 22px 24px;color:#1f2937;\">" +
            "<div style=\"font-size:16px;font-weight:700;margin-bottom:10px;\">Hi " + sName + ",</div>" +
            "<div style=\"font-size:15px;line-height:1.6;color:#374151;margin-bottom:18px;\">The event below has been <b>cancelled</b> by the HOD. You are no longer a coordinator for it, and any passes issued for it have been removed. No further action is needed.</div>" +
            "<table style=\"width:100%;border-collapse:collapse;margin-bottom:8px;\">" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:35%;\">Event</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sEvent + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Date</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sDate + "</td></tr>" +
            "</table>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table></body></html>";

        sendEmail(toEmail, toName, subject, textBody, htmlBody);
    }

    /**
     * Inform a class incharge that one of their students submitted an after-3PM hostel gate pass.
     * Info-only — mirrors the in-app notification. Includes the spec fields.
     */
    public void sendHostelerClassInchargeEmail(String toEmail, String toName, String studentName,
                                               String regNo, String department, String outing,
                                               String purpose, String status) {
        String subject = "Hostel Gate Pass – " + studentName + " (" + regNo + ")";

        String safeOuting  = outing  != null && !outing.isBlank()  ? outing  : "N/A";
        String safePurpose = purpose != null && !purpose.isBlank() ? purpose : "N/A";
        String safeStatus  = status  != null && !status.isBlank()  ? status  : "PENDING";

        String textBody =
            "Dear " + toName + ",\n\n" +
            "One of your students has submitted an after-3PM hostel gate pass request:\n\n" +
            "Student: " + studentName + "\n" +
            "Register No: " + regNo + "\n" +
            "Department: " + (department != null ? department : "N/A") + "\n" +
            "Outing: " + safeOuting + "\n" +
            "Purpose: " + safePurpose + "\n" +
            "Status: " + safeStatus + "\n\n" +
            "This is for your information only — the hostel warden is the approver.\n\n" +
            "Best regards,\nRIT Gate – Visitor Management System";

        String sName    = escapeHtml(toName != null ? toName : "Class Incharge");
        String sStudent = escapeHtml(studentName);
        String sReg     = escapeHtml(regNo);
        String sDept    = escapeHtml(department != null ? department : "N/A");
        String sOuting  = escapeHtml(safeOuting);
        String sPurpose = escapeHtml(safePurpose);
        String sStatus  = escapeHtml(safeStatus);

        String htmlBody =
            "<!DOCTYPE html>" +
            "<html><body style=\"margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;\">" +
            "<tr><td style=\"background:#172b4d;padding:20px 24px;\">" +
            "<div style=\"font-size:22px;color:#ffffff;font-weight:800;\">Hostel Gate Pass — Your Student</div>" +
            "</td></tr>" +
            "<tr><td style=\"padding:26px 24px 22px 24px;color:#1f2937;\">" +
            "<div style=\"font-size:16px;font-weight:700;margin-bottom:10px;\">Hi " + sName + ",</div>" +
            "<div style=\"font-size:15px;line-height:1.6;color:#374151;margin-bottom:18px;\">One of your students has submitted an after-3PM hostel gate pass. This is for your information only — the hostel warden is the approver.</div>" +
            "<table style=\"width:100%;border-collapse:collapse;margin-bottom:8px;\">" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:38%;\">Student</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sStudent + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Register No</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sReg + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Department</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sDept + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Outing</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sOuting + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Purpose</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sPurpose + "</td></tr>" +
            "<tr><td style=\"padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;\">Status</td><td style=\"padding:8px 10px;border:1px solid #e5e7eb;\">" + sStatus + "</td></tr>" +
            "</table>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table></body></html>";

        sendEmail(toEmail, toName, subject, textBody, htmlBody);
    }
}
