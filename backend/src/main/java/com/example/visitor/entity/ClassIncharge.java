package com.example.visitor.entity;

import jakarta.persistence.*;

/**
 * Class incharge data is derived from the students table.
 * students.staff_code = class incharge's staff_code
 * students.class_incharge = class incharge's name
 * students.department + students.section = the class they manage
 *
 * This entity maps to students table for read-only class incharge lookups.
 */
@Entity
@Table(name = "students")
@IdClass(ClassInchargeId.class)
public class ClassIncharge {

    @Id
    @Column(name = "department", length = 100)
    private String department;

    @Id
    @Column(name = "section", length = 10)
    private String section;

    @Column(name = "class_incharge", length = 100)
    private String classInchargeName;

    @Column(name = "staff_code", length = 50)
    private String staffCode;

    public String getDepartment() { return department; }
    public String getSection() { return section; }
    public String getClassInchargeName() { return classInchargeName; }
    public String getStaffCode() { return staffCode; }
}
