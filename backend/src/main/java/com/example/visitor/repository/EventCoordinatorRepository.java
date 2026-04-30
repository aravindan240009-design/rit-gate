package com.example.visitor.repository;

import com.example.visitor.entity.EventCoordinator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventCoordinatorRepository extends JpaRepository<EventCoordinator, Long> {
    List<EventCoordinator> findByEventId(Long eventId);
    List<EventCoordinator> findByStaffCode(String staffCode);
    Optional<EventCoordinator> findByEventIdAndStaffCode(Long eventId, String staffCode);
    boolean existsByEventIdAndStaffCode(Long eventId, String staffCode);
    void deleteByEventIdAndStaffCode(Long eventId, String staffCode);
}
