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

            // Get HOD staff_code from departments table
            List<Map<String, Object>> deptRows = jdbcTemplate.queryForList(
                "SELECT staff_code FROM departments WHERE name = ?", searchDept
            );
            String hodStaffCode = deptRows.isEmpty() ? null : (String) deptRows.get(0).get("staff_code");

            List<com.example.visitor.entity.Staff> teachingStaff = staffRepository.findByDepartment(searchDept);
            List<com.example.visitor.entity.HR> nonTeachingStaff = hrRepository.findByDepartment(searchDept);

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
                    String role = staff.getStaffCode().equals(hodStaffCode) ? "HOD"
                        : (staff.getRole() != null && !staff.getRole().isBlank() ? staff.getRole() : "Faculty");
                    map.put("role", role);
                    return map;
                })
                .forEach(staffData::add);

            nonTeachingStaff.stream()
                .filter(hr -> hr.getHrCode() != null && !hr.getHrCode().isBlank())
                .map(hr -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", hr.getHrCode());
                    map.put("staffCode", hr.getHrCode());
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
