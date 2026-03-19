package com.example.visitor.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HealthController {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:NOT_SET}")
    private String mailUsername;

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Smart Gate API");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", "Backend is running and accessible");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-smtp")
    public ResponseEntity<?> testSmtp() {
        Map<String, Object> response = new HashMap<>();
        response.put("mailUsername", mailUsername);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(mailUsername);
            message.setSubject("SMTP Test - RIT Gate");
            message.setText("SMTP is working. Sent at: " + LocalDateTime.now());
            mailSender.send(message);
            response.put("status", "SUCCESS");
            response.put("message", "Test email sent to " + mailUsername);
        } catch (Exception e) {
            response.put("status", "FAILED");
            response.put("error", e.getMessage());
            response.put("cause", e.getCause() != null ? e.getCause().getMessage() : "null");
        }
        return ResponseEntity.ok(response);
    }
}
