package com.example.visitor.entity;

import java.io.Serializable;
import java.util.Objects;

public class ClassInchargeId implements Serializable {
    private String department;
    private String section;

    public ClassInchargeId() {}
    public ClassInchargeId(String department, String section) {
        this.department = department;
        this.section = section;
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ClassInchargeId)) return false;
        ClassInchargeId that = (ClassInchargeId) o;
        return Objects.equals(department, that.department) && Objects.equals(section, that.section);
    }

    @Override public int hashCode() { return Objects.hash(department, section); }
}
