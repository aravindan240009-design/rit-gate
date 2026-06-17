package com.example.visitor.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * Authorization helpers that read the authenticated principal from the JWT
 * (set by JwtAuthFilter). Use these instead of trusting path/body parameters
 * for the caller's identity — that's what closes the IDOR holes.
 */
public final class Authz {

    private Authz() {}

    /** The userId (regNo/staffCode/hodCode/...) embedded in the caller's token, or null. */
    public static String currentUserId() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return (a != null && a.isAuthenticated()) ? String.valueOf(a.getName()) : null;
    }

    /** The caller's role (STUDENT/STAFF/HOD/HR/SECURITY/ADMIN), or null. */
    public static String currentRole() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getAuthorities() == null) return null;
        return a.getAuthorities().stream()
            .map(g -> g.getAuthority())
            .filter(s -> s.startsWith("ROLE_"))
            .map(s -> s.substring(5))
            .findFirst().orElse(null);
    }

    public static boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(currentRole());
    }

    /**
     * Enforce that the caller is acting as themselves: the supplied id (from a path/body
     * parameter) must equal the token's userId. ADMIN bypasses. Throws 403 otherwise.
     */
    public static void requireSelf(String idFromRequest) {
        String me = currentUserId();
        if (isAdmin()) return;
        if (me == null || idFromRequest == null || !me.equalsIgnoreCase(idFromRequest.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You are not allowed to act on behalf of another user");
        }
    }

    /** The id the caller should act as: their own token id (path params are not trusted). */
    public static String selfId() {
        String me = currentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return me;
    }
}
