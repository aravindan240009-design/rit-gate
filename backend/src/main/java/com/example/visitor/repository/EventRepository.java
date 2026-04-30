package com.example.visitor.repository;

import com.example.visitor.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByCreatedByHodOrderByCreatedAtDesc(String hodCode);
    List<Event> findByStatusOrderByCreatedAtDesc(String status);
}
