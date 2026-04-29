package com.example.visitor.controller;

import com.example.visitor.repository.StaffRepository;
import com.example.visitor.repository.HRRepository;
import com.example.visitor.repository.StudentRepository;
import com.example.visitor.util.DepartmentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DepartmentController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private HRRepository hrRepository;

    @Autowired
    private StudentRepository studentRepository;

    // Get all departments — uses departments table
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllDepartments() {
        try {
            List<Map<String, Object>> departmentList = jdbcTemplate.queryForList(
                "SELECT name, hod, staff_code, student_count, staff_count FROM departments WHERE name IS NOT NULL AND name != ''"
            ).stream().map(row -> {
                String name = (String) row.get("name");
                Map<String, Object> map = new HashMap<>();
                map.put("id", name);
                map.put("name", name);
                map.put("code", name);
                map.put("hod", row.get("hod"));
                map.put("hodStaffCode", row.get("staff_code"));
                map.put("totalStaff", row.get("staff_count"));
                map.put("totalStudents", row.get("student_count"));
                return map;
            }).collect(Collectors.toList());

            System.out.println("Fetched " + departmentList.size() + " departments");
            return ResponseEntity.ok(departmentList);
        } catch (Exception e) {
            System.err.println("Error fetching departments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get department by code
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDepartmentById(@PathVariable String id) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT name, hod, staff_code, student_count, staff_count FROM departments WHERE name = ?", id
            );
            if (rows.isEmpty()) return ResponseEntity.notFound().build();
            Map<String, Object> map = new HashMap<>();
            map.put("id", rows.get(0).get("name"));
            map.put("name", rows.get(0).get("name"));
            map.put("code", rows.get(0).get("name"));
            map.put("hod", rows.get(0).get("hod"));
            map.put("hodStaffCode", rows.get(0).get("staff_code"));
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            System.err.println("Error fetching department: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


    // Get staff by department code — uses /staff-list suffix to avoid path conflict with /{id}
    @GetMapping("/{departmentCode}/staff-list")
    public ResponseEntity<List<Map<String, Object>>> getStaffByDepartment(@PathVariable String departmentCode) {
        try {
            System.out.println("Fetching staff for department: " + departmentCode);
            String searchDept = DepartmentMapper.toStaffDeptFormat(departmentCode);

            // Get HOD staff_code from departments table using normalized department matching.
            List<Map<String, Object>> deptRows = jdbcTemplate.queryForList(
                "SELECT name, staff_code FROM departments WHERE name IS NOT NULL AND name != ''"
            ).stream()
                .filter(row -> DepartmentMapper.isSameDepartment((String) row.get("name"), departmentCode))
                .collect(Collectors.toList());
            String hodStaffCode = deptRows.isEmpty() ? null : (String) deptRows.get(0).get("staff_code");

            List<com.example.visitor.entity.Staff> teachingStaff = staffRepository.findAll().stream()
                .filter(staff -> DepartmentMapper.isSameDepartment(staff.getDepartment(), departmentCode))
                .collect(Collectors.toList());
            List<com.example.visitor.entity.HR> nonTeachingStaff = hrRepository.findAll().stream()
                .filter(hr -> DepartmentMapper.isSameDepartment(hr.getDepartment(), departmentCode))
                .collect(Collectors.toList());

            List<Map<String, Object>> staffData = new java.util.ArrayList<>();

            teachingStaff.stream()
                .map(staff -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", staff.getStaffCode());
                    map.put("staffCode", staff.getStaffCode());
                    map.put("name", staff.getStaffName());
                    map.put("email", staff.getEmail());
                    map.put("phone", staff.getPhone());
                    map.put("department", staff.getDepartment());
                    String role = hodStaffCode != null && staff.getStaffCode().equals(hodStaffCode) ? "HOD"
                        : (staff.getRole() != null && !staff.getRole().isBlank() ? staff.getRole() : "Faculty");
                    map.put("role", role);
                    return map;
                })
                .forEach(staffData::add);

            nonTeachingStaff.stream()
                .map(hr -> {
                    String hrCode = hr.getHrCode();
                    String fallbackId = "NTF-" + Integer.toHexString((hr.getHrName() + "|" + hr.getEmail() + "|" + hr.getDepartment()).hashCode());
                    String effectiveId = (hrCode != null && !hrCode.isBlank()) ? hrCode : fallbackId;
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", effectiveId);
                    map.put("staffCode", effectiveId);
                    map.put("name", hr.getHrName());
                    map.put("email", hr.getEmail());
                    map.put("phone", hr.getPhone());
                    map.put("department", hr.getDepartment());
                    map.put("role", hr.getRole() != null && !hr.getRole().isBlank() ? hr.getRole() : "Non-Teaching Staff");
                    return map;
                })
                .forEach(staffData::add);

            System.out.println("Found " + staffData.size() + " staff members in department " + searchDept);
            return ResponseEntity.ok(staffData);
        } catch (Exception e) {
            System.err.println("Error fetching staff for department: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

}
