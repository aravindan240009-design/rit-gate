package com.example.visitor.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @Column(name = "name")
    private String name;

    @Column(name = "hod")
    private String hod;

    @Column(name = "staff_code")
    private String staffCode;

    @Column(name = "staff_count")
    private Integer totalStaff;

    @Column(name = "student_count")
    private Integer totalStudents;

    public Department() {}
    public Department(String name) { this.name = name; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return name; }
    public String getDepartmentCode() { return name; }
    public String getDepartmentName() { return name; }
    public String getHod() { return hod; }
    public void setHod(String hod) { this.hod = hod; }
    public String getStaffCode() { return staffCode; }
    public void setStaffCode(String staffCode) { this.staffCode = staffCode; }
    public Integer getTotalStaff() { return totalStaff; }
    public void setTotalStaff(Integer totalStaff) { this.totalStaff = totalStaff; }
    public Integer getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    public Boolean getIsActive() { return true; }
}
