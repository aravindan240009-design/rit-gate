package com.example.visitor.repository;

import com.example.visitor.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // regNo field maps to register_number column
    Optional<Student> findByRegNo(String regNo);

    @Query("SELECT s FROM Student s WHERE s.regNo IN :regNos")
    List<Student> findByRegNoIn(@Param("regNos") List<String> regNos);

    List<Student> findByDepartment(String department);

    // Get the HOD name for a department (hod column stores the HOD's name)
    @Query("SELECT DISTINCT s.hod FROM Student s WHERE s.department = :department AND s.hod IS NOT NULL")
    List<String> findHodNamesByDepartment(@Param("department") String department);
}
