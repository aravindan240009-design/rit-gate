package com.example.visitor.entity;

import jakarta.persistence.*;

/**
 * departments table columns: id, name, hod, staff_code, student_count, staff_count
 * id         = integer PK
 * name       = department name (e.g. "AI & DS")
 * hod        = HOD's name
 * staff_code = HOD's staff code (login ID) — NOT the PK, just a regular column
 */
@Entity
@Table(name = "departments")
public class HOD {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", length = 100)
    private String department;

    @Column(name = "hod", length = 200)
    private String hodName;

    @Column(name = "staff_code", length = 50)
    private String hodCode;

    @Transient private String email;
    @Transient private String phone;
    @Transient private String role = "HOD";
    @Transient private boolean isActive = true;

    public Long getNumericId() { return id; }
    public void setNumericId(Long id) { this.id = id; }
    // Keep String getId() for compatibility
    public String getId() { return hodCode; }
    public void setId(String id) { this.hodCode = id; }
    public String getHodCode() { return hodCode; }
    public void setHodCode(String hodCode) { this.hodCode = hodCode; }
    public String getHodName() { return hodName; }
    public void setHodName(String hodName) { this.hodName = hodName; }
    public String getStaffName() { return hodName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean getIsActive() { return true; }
    public void setIsActive(boolean isActive) { this.isActive = isActive; }
}
