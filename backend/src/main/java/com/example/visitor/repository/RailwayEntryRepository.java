package com.example.visitor.repository;

import com.example.visitor.entity.RailwayEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RailwayEntryRepository extends JpaRepository<RailwayEntry, Long> {
    
    List<RailwayEntry> findByUserIdOrderByTimestampDesc(String userId);
    
    @Query("SELECT e FROM RailwayEntry e WHERE DATE(e.timestamp) = CURRENT_DATE ORDER BY e.timestamp DESC")
    List<RailwayEntry> findTodaysEntries();
    
    @Query("SELECT COUNT(e) FROM RailwayEntry e WHERE DATE(e.timestamp) = CURRENT_DATE")
    Long countTodaysEntries();
    
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM RailwayEntry e WHERE e.userId = :userId AND DATE(e.timestamp) = CURRENT_DATE")
    boolean existsByUserIdToday(@org.springframework.data.repository.query.Param("userId") String userId);
}
