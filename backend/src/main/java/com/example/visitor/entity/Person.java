package com.example.visitor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Person maps to the Visitor table — all visitor/person data lives there.
 */
@Entity
@Table(name = "Visitor")
public class Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "qr_code", unique = true)
    private String qrCode;

    @Column(name = "visitor_name", nullable = false)
    private String name;

    @Column(name = "visitor_email", nullable = false)
    private String email;

    @Column(name = "visitor_phone", nullable = false)
    private String phone;

    @Column(name = "role")
    private String type; // VISITOR, STUDENT, FACULTY

    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "department", nullable = false)
    private String department;

    @Column(name = "staff_code")
    private String studentId; // register_no for students

    @Column(name = "person_to_meet")
    private String facultyId; // staff_code for faculty

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "number_of_people")
    private Integer numberOfPeople;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Transient private String designation;
    @Transient private String validFrom;
    @Transient private String validTo;

    public Person() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    // Legacy constructor used by DataInitializer (disabled)
    public Person(String qrCode, String name, String email, String phone, PersonType type, ApprovalStatus status) {
        this();
        this.qrCode = qrCode;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.type = type != null ? type.name() : "VISITOR";
        this.status = status != null ? status.name() : "PENDING";
        this.department = "UNKNOWN";
        this.facultyId = "UNKNOWN";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public PersonType getPersonType() {
        if ("STUDENT".equals(type)) return PersonType.STUDENT;
        if ("FACULTY".equals(type)) return PersonType.FACULTY;
        return PersonType.VISITOR;
    }
    public void setPersonType(PersonType pt) { this.type = pt != null ? pt.name() : "VISITOR"; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public ApprovalStatus getApprovalStatus() {
        if ("APPROVED".equals(status)) return ApprovalStatus.APPROVED;
        if ("REJECTED".equals(status)) return ApprovalStatus.REJECTED;
        return ApprovalStatus.PENDING;
    }
    public void setApprovalStatus(ApprovalStatus s) { this.status = s != null ? s.name() : "PENDING"; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getValidFrom() { return validFrom; }
    public void setValidFrom(String validFrom) { this.validFrom = validFrom; }
    public String getValidTo() { return validTo; }
    public void setValidTo(String validTo) { this.validTo = validTo; }
    public Integer getNumberOfPeople() { return numberOfPeople; }
    public void setNumberOfPeople(Integer n) { this.numberOfPeople = n; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String v) { this.vehicleNumber = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
}
