package com.example.visitor.service;

import com.example.visitor.entity.Staff;
import com.example.visitor.repository.StaffRepository;
import com.example.visitor.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Resolves staff/HOD/HR codes purely from the staff table.
 * - HOD: found by looking up the student's `hod` column (HOD name),
 *        then matching that name in the staff table.
 * - HR:  found by matching role containing "HR" in the staff table.
 * - Staff: first staff member in the department.
 *
 * Each method runs in REQUIRES_NEW so any DB error never poisons
 * the caller's transaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentLookupService {

    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;

    /**
     * Returns the staff_code of the first staff member in the given department.
     * Used to assign a class incharge / staff approver for student gate pass requests.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findStaffForDepartment(String department) {
        try {
            List<Staff> staffList = staffRepository.findByDepartment(department);
            if (!staffList.isEmpty()) {
                return staffList.get(0).getStaffCode();
            }
            log.warn("No staff found for department: {}", department);
        } catch (Exception e) {
            log.error("Error finding staff for department {}: {}", department, e.getMessage());
        }
        return null;
    }

    /**
     * Returns the staff_code of the HOD for the given department.
     * Strategy:
     *   1. Look up the HOD name from the students table (hod column).
     *   2. Find that person by name in the staff table.
     *   3. Fallback: find any staff in the department whose role contains "HOD".
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findHODForDepartment(String department) {
        try {
            // Step 1: get HOD name from students table
            List<String> hodNames = studentRepository.findHodNamesByDepartment(department);
            if (!hodNames.isEmpty()) {
                String hodName = hodNames.get(0);
                if (hodName != null && !hodName.isBlank()) {
                    // Step 2: find that staff member by name
                    Optional<Staff> hodStaff = staffRepository.findByStaffName(hodName.trim());
                    if (hodStaff.isPresent()) {
                        log.info("Found HOD '{}' (code: {}) for department {}", hodName, hodStaff.get().getStaffCode(), department);
                        return hodStaff.get().getStaffCode();
                    }
                    log.warn("HOD name '{}' found in students table but not matched in staff table for dept {}", hodName, department);
                }
            }
        } catch (Exception e) {
            log.warn("HOD lookup via students table failed for dept {}: {}", department, e.getMessage());
        }

        // Step 3: fallback — find staff in department whose role contains "HOD"
        try {
            List<Staff> staffList = staffRepository.findByDepartment(department);
            for (Staff s : staffList) {
                if (s.getRole() != null && s.getRole().toUpperCase().contains("HOD")) {
                    log.info("Found HOD via role fallback: {} for department {}", s.getStaffCode(), department);
                    return s.getStaffCode();
                }
            }
            log.warn("No HOD found for department: {}", department);
        } catch (Exception e) {
            log.error("HOD role fallback failed for department {}: {}", department, e.getMessage());
        }
        return null;
    }

    /**
     * Returns the staff_code of the active HR.
     * Finds the first staff member whose role contains "HR" (e.g. "Senior Manager-HR").
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findActiveHR() {
        try {
            List<Staff> hrStaff = staffRepository.findByRoleContainingIgnoreCase("HR");
            if (!hrStaff.isEmpty()) {
                log.info("Found HR: {} (role: {})", hrStaff.get(0).getStaffCode(), hrStaff.get(0).getRole());
                return hrStaff.get(0).getStaffCode();
            }
            log.warn("No HR staff found in staff table");
        } catch (Exception e) {
            log.error("Error finding active HR: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Returns the full Staff object for a given staff code.
     * Used by controllers/services that need HR/HOD details (name, email, etc.)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<Staff> findStaffByCode(String staffCode) {
        try {
            return staffRepository.findByStaffCode(staffCode);
        } catch (Exception e) {
            log.error("Error finding staff by code {}: {}", staffCode, e.getMessage());
            return Optional.empty();
        }
    }
}
