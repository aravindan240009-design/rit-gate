package com.example.visitor.repository;

import com.example.visitor.entity.HOD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * departments table: id (PK int), name, hod, staff_code, student_count, staff_count
 * staff_code = HOD's login code (NOT the PK — multiple rows can share the same staff_code)
 */
@Repository
public interface HODRepository extends JpaRepository<HOD, Long> {

    // Find by staff_code — returns ALL departments this HOD manages (can be multiple)
    List<HOD> findByHodCode(String hodCode);

    // Find first match by staff_code (for single-dept lookups)
    Optional<HOD> findFirstByHodCode(String hodCode);

    // Find by department name
    Optional<HOD> findByDepartment(String department);

    // Find all HODs for a department
    @Query("SELECT h FROM HOD h WHERE LOWER(h.department) = LOWER(:department)")
    List<HOD> findAllByDepartment(@Param("department") String department);

    // All HODs
    @Query("SELECT h FROM HOD h WHERE h.hodCode IS NOT NULL")
    List<HOD> findAllHODs();

    // Check if a staff_code is a HOD
    @Query("SELECT COUNT(h) FROM HOD h WHERE h.hodCode = :staffCode")
    long countByHodCode(@Param("staffCode") String staffCode);

    default boolean isHOD(String staffCode) {
        return countByHodCode(staffCode) > 0;
    }

    // Find HOD by department name (case-insensitive)
    @Query("SELECT h FROM HOD h WHERE LOWER(h.department) = LOWER(:department)")
    Optional<HOD> findByDepartmentIgnoreCase(@Param("department") String department);

    // S&H HOD
    @Query("SELECT h FROM HOD h WHERE h.department = 'S & H'")
    Optional<HOD> findSHHod();
}
