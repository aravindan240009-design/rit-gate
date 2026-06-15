package com.example.visitor.entity;

import jakarta.persistence.*;

/**
 * non_teaching_staffs table — covers NTF and AO (Admin Officer) roles.
 * Columns: name, staff_code, department, designation, email, phone
 */
@Entity
@Table(name = "non_teaching_staffs_rit")
public class HR {
    @Id
    @Column(name = "staff_code", nullable = false, unique = true, length = 50)
    private String hrCode;

    @Column(name = "name", length = 200)
    private String hrName;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "designation", length = 100)
    private String role;

    @Column(name = "profile", columnDefinition = "LONGTEXT")
    private String profile;

    @Transient private boolean isActive = true;

    public String getId() { return hrCode; }
    public void setId(String id) { this.hrCode = id; }
    public String getHrCode() { return hrCode; }
    public void setHrCode(String hrCode) { this.hrCode = hrCode; }
    public String getHrName() { return hrName; }
    public void setHrName(String hrName) { this.hrName = hrName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getProfile() { return profile; }
    public void setProfile(String profile) { this.profile = profile; }
    public boolean getIsActive() { return true; }
    public void setIsActive(boolean isActive) { this.isActive = isActive; }
}
