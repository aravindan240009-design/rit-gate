package com.example.visitor.repository;

import com.example.visitor.entity.ClassIncharge;
import com.example.visitor.entity.ClassInchargeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Class incharge data is derived from the students table.
 * staff_code column in students = class incharge's staff code.
 */
@Repository
public interface ClassInchargeRepository extends JpaRepository<ClassIncharge, ClassInchargeId> {

    /** Check by exact staff_code match in students table */
    @Query(value = "SELECT COUNT(*) FROM students WHERE staff_code = :staffCode", nativeQuery = true)
    long countByStaffCode(@Param("staffCode") String staffCode);

    /** Check by name — LIKE match on class_incharge column in students */
    @Query(value = "SELECT COUNT(*) FROM students WHERE LOWER(class_incharge) LIKE LOWER(CONCAT('%', :name, '%'))", nativeQuery = true)
    long countByNameContaining(@Param("name") String name);
}
