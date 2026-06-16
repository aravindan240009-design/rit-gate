package com.example.visitor.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "students_rit")
public class Student {
    @Id
    @Column(name = "register_no", nullable = false, unique = true, length = 50)
    private String regNo;

    @Column(name = "name", nullable = false, length = 200)
    private String firstName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "section", length = 10)
    private String section;

    @Column(name = "class_incharge", length = 100)
    private String classIncharge;

    @Column(name = "course", length = 100)
    private String course;

    @Column(name = "batch", length = 20)
    private String batch;

    @Column(name = "degree_type", length = 20)
    private String degreeType;

    // staff_code in students = class incharge's staff code
    @Column(name = "staff_code", length = 50)
    private String staffCode;

    // Relative path to the profile photo, e.g. "studentImages/abc.jpg"
    @Column(name = "profile", columnDefinition = "LONGTEXT")
    private String profile;

    // True when the student stays in a hostel — drives after-3PM warden routing
    @Column(name = "hosteler")
    private Boolean hosteler;

    // MALE / FEMALE — used to pick the gender-matched hostel warden
    @Column(name = "gender", length = 20)
    private String gender;

    @Transient private Long id;
    @Transient private String year;
    @Transient private String hod;
    @Transient private String lastName;
    @Transient private boolean isActive = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRegNo() { return regNo; }
    public void setRegNo(String regNo) { this.regNo = regNo; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return ""; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getFullName() { return firstName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public String getYear() { return semester != null ? String.valueOf(semester) : null; }
    public void setYear(String year) { this.year = year; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public String getClassIncharge() { return classIncharge; }
    public void setClassIncharge(String classIncharge) { this.classIncharge = classIncharge; }
    public String getHod() { return hod; }
    public void setHod(String hod) { this.hod = hod; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    public String getBatch() { return batch; }
    public void setBatch(String batch) { this.batch = batch; }
    public String getDegreeType() { return degreeType; }
    public void setDegreeType(String degreeType) { this.degreeType = degreeType; }
    public String getStaffCode() { return staffCode; }
    public void setStaffCode(String staffCode) { this.staffCode = staffCode; }
    public String getProfile() { return profile; }
    public void setProfile(String profile) { this.profile = profile; }
    public Boolean getHosteler() { return hosteler; }
    public void setHosteler(Boolean hosteler) { this.hosteler = hosteler; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public boolean getIsActive() { return true; }
    public void setIsActive(boolean isActive) { this.isActive = isActive; }
}
