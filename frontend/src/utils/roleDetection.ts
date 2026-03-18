import { UserRole } from '../types';
import { ROLE_PATTERNS } from '../config/api.config';

/**
 * Detect user role based on ID pattern
 * @param userId - User ID to analyze
 * @returns Detected user role
 */
export function detectUserRole(userId: string): UserRole {
  const trimmedId = userId.trim().toUpperCase();

  // Check for HOD (contains "HOD")
  if (ROLE_PATTERNS.HOD.test(trimmedId)) {
    return 'HOD';
  }

  // Check for HR (starts with HR followed by numbers)
  if (ROLE_PATTERNS.HR.test(trimmedId)) {
    return 'HR';
  }

  // Check for Security (starts with SEC followed by numbers)
  if (ROLE_PATTERNS.SECURITY.test(trimmedId)) {
    return 'SECURITY';
  }

  // Check for Staff (2-3 letters followed by numbers, e.g., AD121, CS101)
  if (ROLE_PATTERNS.STAFF.test(trimmedId)) {
    return 'STAFF';
  }

  // Check for Student (only numbers, e.g., 2117240030007)
  if (ROLE_PATTERNS.STUDENT.test(trimmedId)) {
    return 'STUDENT';
  }

  // Default to STUDENT if no pattern matches
  return 'STUDENT';
}

/**
 * Get role display name
 * @param role - User role
 * @returns Display name for the role
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    STUDENT: 'Student',
    STAFF: 'Staff',
    HOD: 'Head of Department',
    HR: 'Human Resources',
    SECURITY: 'Security Personnel',
  };

  return roleNames[role];
}

/**
 * Get role icon name (Ionicons)
 * @param role - User role
 * @returns Icon name for the role
 */
export function getRoleIcon(role: UserRole): string {
  const roleIcons: Record<UserRole, string> = {
    STUDENT: 'school',
    STAFF: 'briefcase',
    HOD: 'shield-checkmark',
    HR: 'people',
    SECURITY: 'shield',
  };

  return roleIcons[role];
}

/**
 * Get role color
 * @param role - User role
 * @returns Color for the role
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    STUDENT: '#06B6D4',
    STAFF: '#8B5CF6',
    HOD: '#F59E0B',
    HR: '#10B981',
    SECURITY: '#EF4444',
  };

  return roleColors[role];
}

/**
 * Validate user ID format
 * @param userId - User ID to validate
 * @returns True if valid, false otherwise
 */
export function validateUserId(userId: string): boolean {
  if (!userId || userId.trim().length === 0) {
    return false;
  }

  const trimmedId = userId.trim();

  // Check if it matches any known pattern
  return (
    ROLE_PATTERNS.HOD.test(trimmedId) ||
    ROLE_PATTERNS.HR.test(trimmedId) ||
    ROLE_PATTERNS.SECURITY.test(trimmedId) ||
    ROLE_PATTERNS.STAFF.test(trimmedId) ||
    ROLE_PATTERNS.STUDENT.test(trimmedId)
  );
}

/**
 * Get user ID placeholder text based on detected role
 * @param userId - Current user ID input
 * @returns Placeholder text
 */
export function getUserIdPlaceholder(userId: string): string {
  if (!userId || userId.trim().length === 0) {
    return 'Enter your ID (Student/Staff/HOD/HR/Security)';
  }

  const role = detectUserRole(userId);
  const placeholders: Record<UserRole, string> = {
    STUDENT: 'Student Registration Number',
    STAFF: 'Staff Code',
    HOD: 'HOD Code',
    HR: 'HR Code',
    SECURITY: 'Security ID',
  };

  return placeholders[role];
}
