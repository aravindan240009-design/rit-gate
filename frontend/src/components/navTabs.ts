/**
 * Canonical bottom-navigation tab lists, one per role. Every screen (dashboards,
 * My Requests, Profile, Gate Logs) must build its BottomNavBar from these so the
 * bar is identical — same tabs, order, icons, size — on every page for a given role.
 *
 * This is the single source of truth for "which tabs does role X get". Previously
 * each screen hand-rolled its own tab array (and ProfileScreen its own markup),
 * which caused missing tabs (e.g. principal Gate Logs) and size/layout jumps
 * between pages.
 */
import { NavTab } from './BottomNavBar';

const HOME: NavTab = { key: 'HOME', label: 'Home', icon: 'home-outline', iconActive: 'home' };
const NEW_PASS: NavTab = { key: 'NEW_PASS', label: 'New Pass', icon: 'add-circle-outline', isAdd: true };
const MY_REQUESTS: NavTab = { key: 'MY_REQUESTS', label: 'My Requests', icon: 'list-outline', iconActive: 'list' };
const PROFILE: NavTab = { key: 'PROFILE', label: 'Profile', icon: 'person-outline', iconActive: 'person' };
const GATE_LOGS: NavTab = { key: 'SCAN_HISTORY', label: 'Gate Logs', icon: 'time-outline', iconActive: 'time' };

/** Student: Home / Requests / History / Profile (no New Pass button — students request via Home). */
const STUDENT_TABS: NavTab[] = [
  HOME,
  { key: 'REQUESTS', label: 'Requests', icon: 'document-text-outline', iconActive: 'document-text' },
  { key: 'HISTORY', label: 'History', icon: 'time-outline', iconActive: 'time' },
  PROFILE,
];

const STAFF_TABS: NavTab[] = [HOME, NEW_PASS, MY_REQUESTS, PROFILE];
const HR_TABS: NavTab[] = [HOME, NEW_PASS, MY_REQUESTS, GATE_LOGS, PROFILE];
const ADMIN_TABS: NavTab[] = [HOME, NEW_PASS, MY_REQUESTS, GATE_LOGS, PROFILE];

export type NavRole = 'STUDENT' | 'STAFF' | 'HOD' | 'HR' | 'NTF' | 'NCI' | 'ADMIN';

/**
 * Returns the canonical tab list for a role.
 * @param isPrincipal — NCI principals/directors additionally get the Gate Logs tab.
 */
export function getNavTabs(role: NavRole, isPrincipal = false): NavTab[] {
  switch (role) {
    case 'STUDENT':
      return STUDENT_TABS;
    case 'HR':
      return HR_TABS;
    case 'ADMIN':
      return ADMIN_TABS;
    case 'NCI':
      // Principal/Director NCI accounts also manage the gate → Gate Logs tab.
      return isPrincipal ? [HOME, NEW_PASS, MY_REQUESTS, GATE_LOGS, PROFILE] : STAFF_TABS;
    case 'STAFF':
    case 'HOD':
    case 'NTF':
    default:
      return STAFF_TABS;
  }
}

/** True when an NCI/staff user's designation marks them a principal or director. */
export function isPrincipalDesignation(user: any): boolean {
  const r = String(user?.role || user?.designation || '').toUpperCase();
  return r.includes('PRINCIPAL') || r.includes('DIRECTOR');
}
