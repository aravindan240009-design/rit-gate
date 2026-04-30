package com.example.visitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_coordinators",
       uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "staff_code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventCoordinator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "staff_code", nullable = false, length = 50)
    private String staffCode;

    @Column(name = "assigned_by", nullable = false, length = 50)
    private String assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        if (assignedAt == null) assignedAt = LocalDateTime.now();
    }
}
