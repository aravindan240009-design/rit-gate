package com.example.visitor.controller;

import com.example.visitor.util.ErrorMessages;

import com.example.visitor.entity.Student;
import com.example.visitor.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStudents() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Student> students = studentRepository.findAll();
            response.put("success", true);
            response.put("students", students);
            response.put("count", students.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching all students", e);
            response.put("success", false);
            response.put("message", "Error fetching students: " + ErrorMessages.userFriendly(e));
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Lean directory for pickers (Event Controller portal etc.) — maps to small
    // DTO maps so the LONGTEXT profile photo column is never serialized.
    @GetMapping("/directory")
    public ResponseEntity<Map<String, Object>> getStudentDirectory() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> students = studentRepository.findAll().stream()
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("regNo", s.getRegNo());
                    m.put("name", s.getFirstName());
                    m.put("department", s.getDepartment());
                    m.put("email", s.getEmail());
                    m.put("course", s.getCourse());
                    m.put("semester", s.getSemester());
                    m.put("section", s.getSection());
                    return m;
                })
                .toList();
            response.put("success", true);
            response.put("students", students);
            response.put("count", students.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching student directory", e);
            response.put("success", false);
            response.put("message", "Error fetching students: " + ErrorMessages.userFriendly(e));
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{regNo}")
    public ResponseEntity<Map<String, Object>> getStudentByRegNo(@PathVariable String regNo) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Student> student = studentRepository.findByRegNo(regNo);
            if (student.isPresent()) {
                response.put("success", true);
                response.put("student", student.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Student not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching student by regNo: " + regNo, e);
            response.put("success", false);
            response.put("message", "Error fetching student: " + ErrorMessages.userFriendly(e));
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<Map<String, Object>> getStudentsByDepartment(@PathVariable String department) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Student> students = studentRepository.findByDepartment(department);
            response.put("success", true);
            response.put("students", students);
            response.put("count", students.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching students by department: " + department, e);
            response.put("success", false);
            response.put("message", "Error fetching students: " + ErrorMessages.userFriendly(e));
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
