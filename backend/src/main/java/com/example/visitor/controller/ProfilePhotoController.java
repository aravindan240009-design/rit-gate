package com.example.visitor.controller;

import com.example.visitor.repository.StudentRepository;
import com.example.visitor.repository.StaffRepository;
import com.example.visitor.repository.HRRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Resolves a user's profile photo URL by their code (regNo / staffCode).
 *
 * The _rit tables store only a relative path (e.g. "studentImages/abc.jpg" or
 * "uploads/123.jpg"); the full image lives at IMS_BASE + path. This endpoint
 * lets the staff request view, security scan view, etc. fetch the photo for
 * any user without enriching every gate-pass / scan response shape.
 */
@RestController
@RequestMapping("/api/profile-photo")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProfilePhotoController {

    /** Base URL where IMS serves the uploaded images. */
    public static final String IMS_BASE = "https://ims.ritchennai.edu.in/";

    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final HRRepository hrRepository;

    public ProfilePhotoController(StudentRepository studentRepository,
                                  StaffRepository staffRepository,
                                  HRRepository hrRepository) {
        this.studentRepository = studentRepository;
        this.staffRepository = staffRepository;
        this.hrRepository = hrRepository;
    }

    /** Build a full image URL from a stored relative path; null/blank → null. */
    public static String toFullUrl(String path) {
        if (path == null || path.isBlank()) return null;
        String p = path.trim();
        if (p.startsWith("http://") || p.startsWith("https://")) return p; // already absolute
        return IMS_BASE + (p.startsWith("/") ? p.substring(1) : p);
    }

    /**
     * GET /api/profile-photo/{code}
     * code may be a student register_no OR a staff_code (teaching or non-teaching).
     * Returns { success, photoUrl } — photoUrl is null when no photo exists.
     */
    @GetMapping("/{code}")
    public Map<String, Object> getPhoto(@PathVariable String code) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("photoUrl", resolve(code));
        return res;
    }

    /** Resolve a photo URL for any code; checks student → teaching → non-teaching. */
    private String resolve(String code) {
        if (code == null || code.isBlank()) return null;
        var student = studentRepository.findByRegNo(code);
        if (student.isPresent()) return toFullUrl(student.get().getProfile());

        var staff = staffRepository.findByStaffCode(code);
        if (staff.isPresent()) return toFullUrl(staff.get().getProfile());

        var hr = hrRepository.findByHrCode(code);
        if (hr.isPresent()) return toFullUrl(hr.get().getProfile());

        return null;
    }
}
