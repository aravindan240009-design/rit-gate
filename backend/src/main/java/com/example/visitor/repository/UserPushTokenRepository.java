package com.example.visitor.repository;

import com.example.visitor.entity.UserPushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPushTokenRepository extends JpaRepository<UserPushToken, Long> {
    
    // Find by user ID
    List<UserPushToken> findByUserId(String userId);
    
    // Find by push token
    Optional<UserPushToken> findByPushToken(String pushToken);
    
    // Find by user ID and device type
    Optional<UserPushToken> findByUserIdAndDeviceType(String userId, String deviceType);
    
    // Delete by user ID
    @Modifying
    @Transactional
    void deleteByUserId(String userId);
    
    // Delete by push token
    @Modifying
    @Transactional
    void deleteByPushToken(String pushToken);
}
