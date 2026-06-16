package com.example.visitor.util;

import com.example.visitor.entity.Student;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Single source of truth for the after-3PM hostel gate-pass routing rule.
 *
 * Business rule: when a HOSTELER submits a gate pass AT/AFTER 15:00 (server/IST time),
 * the request is routed to the gender-matched Hostel Warden instead of the normal
 * Class-Incharge -> HOD chain.
 *
 * All DB literals that drive this rule are centralized here so a change to any of them
 * (cutoff, gender values, warden designation) is a one-file edit. The matching column
 * names live on the Student / HR entities.
 */
public final class HostelConfig {

    private HostelConfig() {}

    /** Cutoff: requests at or after this local time follow the hostel-warden flow. */
    public static final LocalTime CUTOFF = LocalTime.of(15, 0);

    /** All gate-pass timestamps are server time in IST; evaluate the cutoff in IST too. */
    public static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    /** Designation text on non_teaching_staffs_rit that marks a Hostel Warden account. */
    public static final String WARDEN_DESIGNATION = "Hostel warden";

    public static final String GENDER_MALE = "MALE";
    public static final String GENDER_FEMALE = "FEMALE";

    /** True when the given submission time is at or after the 3PM cutoff. */
    public static boolean isAfterCutoff(LocalDateTime when) {
        LocalDateTime effective = (when != null) ? when : LocalDateTime.now(APP_ZONE);
        return !effective.toLocalTime().isBefore(CUTOFF); // >= 15:00:00
    }

    /** Lenient hosteler check — handles a null boolean as "not a hosteler". */
    public static boolean isHosteler(Student student) {
        return student != null && Boolean.TRUE.equals(student.getHosteler());
    }

    /**
     * Normalize a free-form gender value to MALE / FEMALE (or null if unrecognized).
     * Accepts "MALE"/"FEMALE" and the single-letter "M"/"F" just in case.
     */
    public static String normalizeGender(String raw) {
        if (raw == null) return null;
        String g = raw.trim().toUpperCase();
        if (g.isEmpty()) return null;
        if (g.startsWith("M")) return GENDER_MALE;
        if (g.startsWith("F")) return GENDER_FEMALE;
        return null;
    }

    /** True when a staff designation marks a Hostel Warden. */
    public static boolean isWardenDesignation(String designation) {
        return designation != null && WARDEN_DESIGNATION.equalsIgnoreCase(designation.trim());
    }
}
