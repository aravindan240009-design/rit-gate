package com.example.visitor.service;

import com.example.visitor.entity.HOD;
import com.example.visitor.entity.HR;
import com.example.visitor.entity.Staff;
import com.example.visitor.repository.HODRepository;
import com.example.visitor.repository.HRRepository;
import com.example.visitor.repository.StaffRepository;
import com.example.visitor.repository.StudentRepository;
import com.example.visitor.util.DepartmentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Resolves staff/HOD/HR codes from the correct tables:
 * - HOD: from departments table (staff_code column)
 * - HR:  from non_teaching_staffs where designation = 'Senior Manager - HR'
 * - Staff: from teaching_staffs
 *
 * First-year students (semester 1-2) always get S&H HOD (MA36).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentLookupService {

    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;
    private final HODRepository hodRepository;
    private final HRRepository hrRepository;

    /**
     * Returns the staff_code of the class incharge for the given department.
     * Looks up teaching_staffs for the department.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findStaffForDepartment(String department) {
        try {
            String staffDept = DepartmentMapper.toStaffDeptFormat(department);
            log.info("findStaffForDepartment: '{}' → '{}'", department, staffDept);
            // Find class incharges (staff_code in students.staff_code)
            List<String> ciCodes = staffRepository.findAllClassInchargeCodes();
            List<Staff> staffList = staffRepository.findByDepartment(staffDept);
            // Prefer a class incharge from this department
            for (Staff s : staffList) {
                if (ciCodes.contains(s.getStaffCode())) {
                    return s.getStaffCode();
                }
            }
            // Fallback: any staff in department
            if (!staffList.isEmpty()) {
                return staffList.get(0).getStaffCode();
            }
            log.warn("No staff found for department: {}", staffDept);
        } catch (Exception e) {
            log.error("Error finding staff for department {}: {}", department, e.getMessage());
        }
        return null;
    }

    /**
     * Returns the staff_code of the HOD for the given department.
     * Source: departments table (staff_code column).
     *
     * Special rule: for first-year students (semester 1-2), always return S&H HOD.
     * Pass semester=1 or semester=2 to trigger this.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findHODForDepartment(String department) {
        return findHODForDepartment(department, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findHODForDepartment(String department, Integer semester) {
        try {
            // First-year rule: semester 1 or 2 → always S&H HOD
            if (semester != null && (semester == 1 || semester == 2)) {
                Optional<HOD> shHod = hodRepository.findSHHod();
                if (shHod.isPresent() && shHod.get().getHodCode() != null) {
                    log.info("First-year student → S&H HOD: {}", shHod.get().getHodCode());
                    return shHod.get().getHodCode();
                }
            }

            // Look up HOD from departments table by department name
            String staffDept = DepartmentMapper.toStaffDeptFormat(department);

            // Try exact match first
            Optional<HOD> hod = hodRepository.findByDepartmentIgnoreCase(staffDept);
            if (hod.isPresent() && hod.get().getHodCode() != null) {
                log.info("HOD found for dept '{}': {}", staffDept, hod.get().getHodCode());
                return hod.get().getHodCode();
            }

            // Try original department string
            if (!staffDept.equals(department)) {
                hod = hodRepository.findByDepartmentIgnoreCase(department);
                if (hod.isPresent() && hod.get().getHodCode() != null) {
                    log.info("HOD found for dept '{}': {}", department, hod.get().getHodCode());
                    return hod.get().getHodCode();
                }
            }

            log.warn("No HOD found for department: '{}'", department);
        } catch (Exception e) {
            log.error("HOD lookup failed for dept '{}': {}", department, e.getMessage());
        }
        return null;
    }

    /**
     * Returns the staff_code of the active HR.
     * Source: non_teaching_staffs where designation = 'Senior Manager - HR'.
     * If multiple, returns the first one.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String findActiveHR() {
        try {
            List<HR> hrList = hrRepository.findAllHR();
            if (!hrList.isEmpty()) {
                log.info("Found HR: {} ({})", hrList.get(0).getHrCode(), hrList.get(0).getHrName());
                return hrList.get(0).getHrCode();
            }
            log.warn("No HR staff found in non_teaching_staffs");
        } catch (Exception e) {
            log.error("Error finding active HR: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Returns the full Staff object for a given staff code.
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
