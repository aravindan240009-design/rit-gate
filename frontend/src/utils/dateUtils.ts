/**
 * dateUtils.ts
 *
 * All DISPLAY formatting uses the device's local timezone (wherever the user is).
 * All PARSING of bare ISO strings from the backend appends +05:30 because the
 * backend JVM is set to IST (Asia/Kolkata) and stores LocalDateTime without suffix.
 *
 * Functions ending in "Local" use IST-aware parsing (backend timestamps).
 * Functions without "Local" use UTC-aware parsing (append Z) for legacy compat.
 */

// ── Device timezone (for display) ────────────────────────────────────────────
const LOCAL_TZ = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; }
})();
const TZ: Intl.DateTimeFormatOptions = LOCAL_TZ ? { timeZone: LOCAL_TZ } : {};

// ── Parsers ───────────────────────────────────────────────────────────────────

/**
 * Parse bare ISO string as UTC (append Z).
 * Used for legacy/UTC-stored fields.
 */
const toDate = (d: Date | string | null | undefined): Date => {
  if (!d) return new Date();
  if (typeof d === 'string') {
    const bare = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(d.trim());
    return new Date(bare ? d.trim() + 'Z' : d);
  }
  return d;
};

/**
 * Parse bare ISO string as IST (append +05:30).
 * The backend JVM timezone is IST so all LocalDateTime values are IST.
 * Use this for requestDate, createdAt, exitDateTime, etc.
 */
const toDateLocal = (d: Date | string | null | undefined): Date => {
  if (!d) return new Date();
  if (typeof d === 'string') {
    const bare = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(d.trim());
    return new Date(bare ? d.trim() + '+05:30' : d);
  }
  return d;
};

// toDateIST uses the same IST parser
const toDateIST = toDateLocal;

// ── Formatting helpers ────────────────────────────────────────────────────────

/** "15 Jan 2025, 02:30 PM" — UTC-parsed, device-local display */
export const formatDateTime = (date: Date | string): string => {
  const d = toDate(date);
  return d.toLocaleString('en-IN', {
    ...TZ, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/** "15 Jan 2025, 02:30 PM" — IST-parsed, device-local display */
export const formatDateTimeLocal = (date: Date | string): string => {
  const d = toDateLocal(date);
  return d.toLocaleString('en-IN', {
    ...TZ, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/** "15 Jan 2025, 02:30 PM" — IST-parsed, IST display (for gate log exports etc.) */
export const formatDateTimeIST = (date: Date | string): string => {
  const d = toDateIST(date);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/** "15 Jan, 2:30 PM" — compact, UTC-parsed, device-local display */
export const formatDateTimeShort = (date: Date | string): string => {
  const d = toDate(date);
  return d.toLocaleString('en-IN', {
    ...TZ, month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

/** "15 Jan, 2:30 PM" — compact, IST-parsed, device-local display */
export const formatDateTimeShortLocal = (date: Date | string): string => {
  const d = toDateLocal(date);
  return d.toLocaleString('en-IN', {
    ...TZ, month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

/** "15 Jan 2025" — UTC-parsed, device-local display */
export const formatDate = (date: Date | string): string => {
  const d = toDate(date);
  return d.toLocaleDateString('en-IN', { ...TZ, year: 'numeric', month: 'short', day: 'numeric' });
};

/** "15 Jan 2025" — IST-parsed, device-local display */
export const formatDateLocal = (date: Date | string): string => {
  const d = toDateLocal(date);
  return d.toLocaleDateString('en-IN', { ...TZ, year: 'numeric', month: 'short', day: 'numeric' });
};

/** "15 Jan" — UTC-parsed, device-local display */
export const formatDateShort = (date: Date | string): string => {
  const d = toDate(date);
  return d.toLocaleDateString('en-IN', { ...TZ, month: 'short', day: 'numeric' });
};

/** "15 Jan" — IST-parsed, device-local display */
export const formatDateShortLocal = (date: Date | string): string => {
  const d = toDateLocal(date);
  return d.toLocaleDateString('en-IN', { ...TZ, month: 'short', day: 'numeric' });
};

/** "15/01/2025" — UTC-parsed, device-local display */
export const formatDateGB = (date: Date | string): string => {
  const d = toDate(date);
  return d.toLocaleDateString('en-GB', { ...TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** "02:30 PM" — UTC-parsed, device-local display */
export const formatTime = (date: Date | string): string => {
  const d = toDate(date);
  return d.toLocaleTimeString('en-IN', { ...TZ, hour: '2-digit', minute: '2-digit', hour12: true });
};

/** "02:30 PM" — IST-parsed, device-local display */
export const formatTimeLocal = (date: Date | string): string => {
  const d = toDateLocal(date);
  return d.toLocaleTimeString('en-IN', { ...TZ, hour: '2-digit', minute: '2-digit', hour12: true });
};

// ── Relative time ─────────────────────────────────────────────────────────────

/** "2m ago", "3h ago", "2d ago" — UTC-parsed */
export const getRelativeTime = (date: Date | string): string => {
  const d = toDate(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
};

/** "2m ago", "3h ago", "2d ago" — IST-parsed (correct for backend timestamps) */
export const getRelativeTimeLocal = (date: Date | string): string => {
  const d = toDateLocal(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateLocal(d);
};

/** "2m", "3h" — ultra-compact, UTC-parsed */
export const getRelativeTimeShort = (date: Date | string): string => {
  const d = toDate(date);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

// ── Today checks ──────────────────────────────────────────────────────────────

/** Is today — UTC-parsed */
export const isToday = (date: Date | string): boolean => {
  const d = toDate(date);
  return d.toLocaleDateString('en-IN', TZ) === new Date().toLocaleDateString('en-IN', TZ);
};

/** Is today — IST-parsed (correct for backend timestamps) */
export const isTodayLocal = (date: Date | string): boolean => {
  const d = toDateLocal(date);
  return d.toLocaleDateString('en-IN', TZ) === new Date().toLocaleDateString('en-IN', TZ);
};

export const isThisWeek = (date: Date | string): boolean => {
  const d = toDate(date);
  return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
};

export const isThisMonth = (date: Date | string): boolean => {
  const d = toDate(date);
  return d >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
};

// ── Timestamp helpers ─────────────────────────────────────────────────────────

/** Numeric ms timestamp — IST-parsed */
export const toTimestampLocal = (date: Date | string | null | undefined): number =>
  toDateLocal(date).getTime();

/** Is within last 24 hours — IST-parsed */
export const isWithinLast24HoursLocal = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  const diff = Date.now() - toTimestampLocal(date);
  return diff >= 0 && diff < 24 * 60 * 60 * 1000;
};

/** Current IST time as ISO string (for sending to backend) */
export const nowIST = (): string => new Date().toISOString();
