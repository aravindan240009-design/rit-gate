package com.example.visitor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Visit maps to the Visitor table.
 */
@Entity
@Table(name = "Visitor")
public class Visit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "number_of_people", nullable = false)
    private Integer numberOfPeople;

    @Transient
    private List<String> visitorNames;

    @Column(name = "department", nullable = false)
    private String departmentName;

    @Column(name = "staff_code")
    private String staffCode;

    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    private String purposeOfVisit;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime visitDateTime;

    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "qr_code")
    private String qrCode;

    // Required non-null fields for Visitor table
    @Column(name = "visitor_name", nullable = false)
    private String visitorName = "Visitor";

    @Column(name = "visitor_email", nullable = false)
    private String visitorEmail = "";

    @Column(name = "visitor_phone", nullable = false)
    private String visitorPhone = "";

    @Column(name = "person_to_meet", nullable = false)
    private String personToMeet = "";

    @Transient private Department department;
    @Transient private Staff staff;

    public Visit() {
        this.visitDateTime = LocalDateTime.now();
        this.status = "PENDING";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getNumberOfPeople() { return numberOfPeople; }
    public void setNumberOfPeople(Integer n) { this.numberOfPeople = n; }
    public List<String> getVisitorNames() { return visitorNames; }
    public void setVisitorNames(List<String> v) { this.visitorNames = v; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department d) { this.department = d; if (d != null) this.departmentName = d.getName(); }
    public Staff getStaff() { return staff; }
    public void setStaff(Staff s) { this.staff = s; if (s != null) this.staffCode = s.getStaffCode(); }
    public String getPurposeOfVisit() { return purposeOfVisit; }
    public void setPurposeOfVisit(String p) { this.purposeOfVisit = p; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String v) { this.vehicleNumber = v; }
    public LocalDateTime getVisitDateTime() { return visitDateTime; }
    public void setVisitDateTime(LocalDateTime t) { this.visitDateTime = t; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public String getQrCode() { return qrCode; }
    public void setQrCode(String q) { this.qrCode = q; }
}
