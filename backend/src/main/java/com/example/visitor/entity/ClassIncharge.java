package com.example.visitor.entity;

import jakarta.persistence.*;

/**
 * Maps the existing `class_incharge` table.
 * Columns: department, section, class_incharge_name, staff_code
 * No primary key defined in DB — using composite @IdClass workaround with @EmbeddedId.
 * Since all columns are nullable we use a generated surrogate via @GeneratedValue on a
 * @Column that doesn't exist — instead we use @Id on department+section as a safe read-only entity.
 */
@Entity
@Table(name = "class_incharge")
@IdClass(ClassInchargeId.class)
public class ClassIncharge {

    @Id
    @Column(name = "department", length = 100)
    private String department;

    @Id
    @Column(name = "section", length = 5)
    private String section;

    @Column(name = "class_incharge_name", length = 100)
    private String classInchargeName;

    @Column(name = "staff_code", length = 20)
    private String staffCode;

    public String getDepartment() { return department; }
    public String getSection() { return section; }
    public String getClassInchargeName() { return classInchargeName; }
    public String getStaffCode() { return staffCode; }
}
