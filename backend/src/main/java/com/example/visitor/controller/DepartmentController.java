package com.example.visitor.controller;

import com.example.visitor.entity.Department;
import com.example.visitor.repository.DepartmentRepository;
import com.example.visitor.repository.StaffRepository;
import com.example.visitor.util.DepartmentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private StaffRepository staffRepository;
    
    // Get all departments
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllDepartments() {
        try {
            List<Department> departments = departmentRepository.findAll();
            List<Map<String, Object>> departmentList = departments.stream()
                .filter(dept -> dept.getIsActive()) // Only active departments
                .map(dept -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", dept.getName()); // Use name as id for frontend compatibility
                    map.put("name", dept.getName());
                    map.put("code", dept.getName());
                    return map;
                })
                .collect(Collectors.toList());
            
            System.out.println("Fetching " + departmentList.size() + " departments from database");
            return ResponseEntity.ok(departmentList);
        } catch (Exception e) {
            System.err.println("Error fetching departments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Get department by ID (code)
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDepartmentById(@PathVariable String id) {
        try {
            return departmentRepository.findById(id)
                .map(dept -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", dept.getName());
                    map.put("name", dept.getName());
                    map.put("code", dept.getName());
                    return map;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error fetching department: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


    // Get staff by department code
    @GetMapping("/{departmentCode}/staff")
    public ResponseEntity<List<Map<String, Object>>> getStaffByDepartment(@PathVariable String departmentCode) {
        try {
            System.out.println("Fetching staff for department: " + departmentCode);
            
            // Convert to short code if it's a full name (e.g. "Computer Science" -> "CSE")
            String searchDept = DepartmentMapper.toShortCode(departmentCode);
            System.out.println("Resolved search department to: " + searchDept);

            // Get staff from the Staff repository only
            List<com.example.visitor.entity.Staff> staffList = staffRepository.findByDepartment(searchDept);

            List<Map<String, Object>> staffData = staffList.stream()
                .map(staff -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", staff.getStaffCode());
                    map.put("staffCode", staff.getStaffCode());
                    map.put("name", staff.getStaffName());
                    map.put("email", staff.getEmail());
                    map.put("phone", staff.getPhone());
                    map.put("department", staff.getDepartment());
                    return map;
                })
                .collect(Collectors.toList());

            System.out.println("Found " + staffData.size() + " staff members in department " + searchDept);
            return ResponseEntity.ok(staffData);
        } catch (Exception e) {
            System.err.println("Error fetching staff for department: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

}
