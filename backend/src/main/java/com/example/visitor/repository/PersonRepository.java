package com.example.visitor.repository;

import com.example.visitor.entity.Person;
import com.example.visitor.entity.PersonType;
import com.example.visitor.entity.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Person maps to Visitor table.
 * type column = role (VISITOR/STUDENT/FACULTY)
 * status column = PENDING/APPROVED/REJECTED
 * studentId maps to staff_code column
 * facultyId maps to person_to_meet column
 */
@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {

    Optional<Person> findByQrCode(String qrCode);

    @Query("SELECT p FROM Person p WHERE p.type = :type")
    List<Person> findByType(@Param("type") String type);

    default List<Person> findByType(PersonType type) {
        return findByType(type != null ? type.name() : "VISITOR");
    }

    @Query("SELECT p FROM Person p WHERE p.status = :status")
    List<Person> findByStatus(@Param("status") String status);

    default List<Person> findByStatus(ApprovalStatus status) {
        return findByStatus(status != null ? status.name() : "PENDING");
    }

    @Query("SELECT p FROM Person p WHERE p.type = :type AND p.status = :status")
    List<Person> findByTypeAndStatus(@Param("type") String type, @Param("status") String status);

    default List<Person> findByTypeAndStatus(PersonType type, ApprovalStatus status) {
        return findByTypeAndStatus(
            type != null ? type.name() : "VISITOR",
            status != null ? status.name() : "PENDING"
        );
    }

    Optional<Person> findByEmail(String email);

    // studentId maps to staff_code column
    Optional<Person> findByStudentId(String studentId);

    // facultyId maps to person_to_meet column
    Optional<Person> findByFacultyId(String facultyId);
}
