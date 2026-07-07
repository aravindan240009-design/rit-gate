import { ECUser, Event, Staff, StudentLite, Coordinator, EventPass } from '../types';

const BASE = process.env.REACT_APP_API_URL || 'https://rit-gate.onrender.com/api';

// ── token helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'ec_portal_token';

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.clone().json();
    if (typeof d?.message === 'string') return d.message;
  } catch {}
  try { const t = await res.text(); if (t) return t; } catch {}
  return fallback;
}

// ── auth ───────────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<{ user: ECUser }> {
  const res = await fetch(`${BASE}/auth/event-controller/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
  saveToken(data.token);
  return { user: { ...data.user, token: data.token } };
}

// ── events ─────────────────────────────────────────────────────────────────

export async function fetchAllEvents(): Promise<Event[]> {
  const res = await fetch(`${BASE}/events/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, 'Failed to load events'));
  const data = await res.json();
  return data.events ?? [];
}

export async function createEvent(
  createdBy: string,
  eventName: string,
  eventDate: string,
  venue: string
): Promise<Event> {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ hodCode: createdBy, eventName, eventDate, venue }),
  });
  const data = await res.json();
  if (!res.ok || data.status === 'ERROR') throw new Error(data.message || 'Failed to create event');
  return data.event;
}

export async function deleteEvent(eventId: number, byUser: string): Promise<void> {
  const res = await fetch(`${BASE}/events/${eventId}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ hodCode: byUser }),
  });
  const data = await res.json();
  if (!res.ok || data.status === 'ERROR') throw new Error(data.message || 'Failed to delete event');
}

// ── coordinators ───────────────────────────────────────────────────────────

export async function fetchCoordinators(eventId: number): Promise<Coordinator[]> {
  const res = await fetch(`${BASE}/events/${eventId}/coordinators`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, 'Failed to load coordinators'));
  const data = await res.json();
  return data.coordinators ?? [];
}

export async function assignCoordinators(
  eventId: number,
  staffCodes: string[],
  byUser: string
): Promise<{ assigned: number; alreadyAssigned: number }> {
  const res = await fetch(`${BASE}/events/${eventId}/coordinators`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ staffCodes }),
  });
  const data = await res.json();
  if (!res.ok || data.status === 'ERROR') throw new Error(data.message || 'Failed to assign coordinators');
  const results: Array<{ staffCode: string; status: string }> = data.assigned ?? [];
  const assigned = results.filter(r => r.status === 'ASSIGNED').length;
  const alreadyAssigned = results.filter(r => r.status === 'ALREADY_ASSIGNED').length;
  return { assigned, alreadyAssigned };
}

export async function removeCoordinator(eventId: number, staffCode: string): Promise<void> {
  const res = await fetch(`${BASE}/events/${eventId}/coordinators/${staffCode}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || data.status === 'ERROR') throw new Error(data.message || 'Failed to remove coordinator');
}

// ── staff ──────────────────────────────────────────────────────────────────

export async function fetchAllStaff(): Promise<Staff[]> {
  const res = await fetch(`${BASE}/staff`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, 'Failed to load staff'));
  const data = await res.json();
  const list: any[] = Array.isArray(data) ? data : data.staff ?? [];
  return list.map((s) => ({
    staffCode: s.staffCode || s.staffId || s.id || '',
    name: s.staffName || s.name || '',
    department: s.department || '',
    email: s.email || '',
    phone: s.phone || '',
    role: s.role || '',
  }));
}

// ── students ───────────────────────────────────────────────────────────────

export async function fetchAllStudents(): Promise<StudentLite[]> {
  const res = await fetch(`${BASE}/students/directory`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, 'Failed to load students'));
  const data = await res.json();
  return data.students ?? [];
}

// ── passes ─────────────────────────────────────────────────────────────────

export async function fetchEventPasses(eventId: number): Promise<EventPass[]> {
  const res = await fetch(`${BASE}/events/${eventId}/passes`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readError(res, 'Failed to load passes'));
  const data = await res.json();
  return data.passes ?? [];
}
