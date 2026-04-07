package com.example.visitor.repository;

import com.example.visitor.entity.ClassIncharge;
import com.example.visitor.entity.ClassInchargeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassInchargeRepository extends JpaRepository<ClassIncharge, ClassInchargeId> {

    /** Check by exact staff_code match */
    @Query("SELECT COUNT(c) FROM ClassIncharge c WHERE c.staffCode = :staffCode")
    long countByStaffCode(@Param("staffCode") String staffCode);

    /** Check by name — LIKE match to handle suffixes like '/AP' */
    @Query("SELECT COUNT(c) FROM ClassIncharge c WHERE LOWER(c.classInchargeName) LIKE LOWER(CONCAT('%', :name, '%'))")
    long countByNameContaining(@Param("name") String name);
}
