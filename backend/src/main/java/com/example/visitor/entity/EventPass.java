package com.example.visitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_passes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "email", nullable = false, length = 200)
    private String email;

    @Column(name = "college_name", nullable = false, length = 300)
    private String collegeName;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "student_id", length = 100)
    private String studentId;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "course", length = 100)
    private String course;

    @Column(name = "qr_string", length = 500)
    private String qrString;

    @Column(name = "qr_token", unique = true, length = 100)
    private String qrToken;

    @Column(name = "manual_entry_code", length = 10)
    private String manualEntryCode;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "entry_scanned_at")
    private LocalDateTime entryScannedAt;

    @Column(name = "exit_scanned_at")
    private LocalDateTime exitScannedAt;

    @Column(name = "entry_scanned_by", length = 50)
    private String entryScannedBy;

    @Column(name = "exit_scanned_by", length = 50)
    private String exitScannedBy;

    @Column(name = "exit_reason", length = 50)
    private String exitReason;

    @Column(name = "qr_expires_at")
    private LocalDateTime qrExpiresAt;

    @Column(name = "uploaded_by", nullable = false, length = 50)
    private String uploadedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
