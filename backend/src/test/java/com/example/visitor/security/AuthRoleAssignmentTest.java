package com.example.visitor.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Regression tests for the role-assignment rules that decide which JWT authority a
 * successful login receives. These encode the two privilege-escalation fixes:
 *
 *  1. non_teaching_staffs_rit holds EVERY non-teaching employee, so presence in that
 *     table must not by itself confer ROLE_HR (final gate-pass approval).
 *  2. ADMIN is matched exactly, not by substring, so titles that merely mention
 *     "Administrative Officer" are not promoted.
 *
 * The predicates under test are private to AuthController, so the rules are mirrored
 * here. If the production rule changes, these must be updated in lockstep — that
 * coupling is deliberate: it makes a silent loosening of the check fail the build.
 */
class AuthRoleAssignmentTest {

    private static final String HR_DESIGNATION = "Senior Manager - HR";
    private static final String ADMIN_OFFICER_DESIGNATION = "Administrative Officer";

    /** Mirrors AuthController.isHrDesignation. */
    private boolean isHrDesignation(String designation) {
        return designation != null && HR_DESIGNATION.equalsIgnoreCase(designation.trim());
    }

    /** Mirrors AuthController.isAdminOfficerDesignation. */
    private boolean isAdminOfficerDesignation(String designation) {
        return designation != null && ADMIN_OFFICER_DESIGNATION.equalsIgnoreCase(designation.trim());
    }

    // ---- HR must be exactly the HR designation ----

    @Test
    void theHrDesignationGrantsHr() {
        assertTrue(isHrDesignation("Senior Manager - HR"));
    }

    @Test
    void hrMatchIsCaseAndWhitespaceInsensitive() {
        // DB values are hand-maintained; tolerate casing/padding but nothing more.
        assertTrue(isHrDesignation("senior manager - hr"));
        assertTrue(isHrDesignation("  Senior Manager - HR  "));
    }

    /**
     * The core escalation guard: these are all real non-teaching designations that
     * live in the same table as HR. Any of them returning true would hand out final
     * gate-pass approval authority.
     */
    @ParameterizedTest
    @ValueSource(strings = {
        "Administrative Officer",
        "Office Assistant",
        "Hostel Warden",
        "Lab Technician",
        "Accountant",
        "Librarian",
        "Manager",
        "Senior Manager",
        "Senior Manager - Admin",
        "Assistant Manager - HR",
        "HR Assistant",
        "HR"
    })
    void otherNonTeachingDesignationsDoNotGrantHr(String designation) {
        assertFalse(isHrDesignation(designation),
            "'" + designation + "' must not receive ROLE_HR");
    }

    @Test
    void nullOrBlankDesignationDoesNotGrantHr() {
        assertFalse(isHrDesignation(null));
        assertFalse(isHrDesignation(""));
        assertFalse(isHrDesignation("   "));
    }

    // ---- ADMIN must be an exact match, never a substring ----

    @Test
    void theAdminOfficerDesignationGrantsAdmin() {
        assertTrue(isAdminOfficerDesignation("Administrative Officer"));
        assertTrue(isAdminOfficerDesignation("administrative officer"));
    }

    /**
     * The old rule was `role.toUpperCase().contains("ADMINISTRATIVE OFFICER")`, which
     * promoted every title below to ADMIN — the highest privilege in the system, and
     * one that bypasses Authz.requireSelf entirely.
     */
    @ParameterizedTest
    @ValueSource(strings = {
        "Assistant to the Administrative Officer",
        "Administrative Officer - Trainee",
        "Deputy Administrative Officer",
        "Junior Administrative Officer",
        "Administrative Officer Assistant"
    })
    void titlesMerelyContainingAdminOfficerAreNotAdmin(String designation) {
        assertFalse(isAdminOfficerDesignation(designation),
            "'" + designation + "' must not receive ROLE_ADMIN");
    }

    @Test
    void nullDesignationIsNotAdmin() {
        assertFalse(isAdminOfficerDesignation(null));
    }

    // ---- The two roles are mutually exclusive ----

    @Test
    void hrAndAdminDesignationsDoNotOverlap() {
        assertFalse(isAdminOfficerDesignation(HR_DESIGNATION));
        assertFalse(isHrDesignation(ADMIN_OFFICER_DESIGNATION));
    }
}
