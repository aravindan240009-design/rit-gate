import {
  Department,
  Staff,
  VisitorRegistration,
  VisitorResponse,
  VisitorStatus,
} from '../types';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://rit-gate.onrender.com/api';

const PORTAL_TOKEN_KEY = 'ritgate_portal_token_v1';

interface PortalToken {
  token: string;
  expiresAt: number; // epoch ms
}

let cachedToken: PortalToken | null = null;

function readCachedToken(): PortalToken | null {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken;
  try {
    const raw = localStorage.getItem(PORTAL_TOKEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PortalToken;
      if (parsed.expiresAt > Date.now() + 30_000) {
        cachedToken = parsed;
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Fetch (and cache) the scoped VISITOR_PORTAL token used to read the public
 * department/staff pickers. The backend restricts this token to those endpoints only.
 */
async function getPortalToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const existing = readCachedToken();
    if (existing) return existing.token;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/visitor-portal-token`, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.token) return null;
    const ttl = (Number(data.expiresInSeconds) || 3600) * 1000;
    cachedToken = { token: data.token, expiresAt: Date.now() + ttl };
    try {
      localStorage.setItem(PORTAL_TOKEN_KEY, JSON.stringify(cachedToken));
    } catch {
      /* ignore */
    }
    return cachedToken.token;
  } catch {
    return null;
  }
}

/** GET a scoped endpoint with the portal token, re-minting once on 401/403. */
async function authGet(path: string): Promise<Response> {
  const token = await getPortalToken();
  const doFetch = (t: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    });
  let res = await doFetch(token);
  if (res.status === 401 || res.status === 403) {
    const fresh = await getPortalToken(true);
    if (fresh) res = await doFetch(fresh);
  }
  return res;
}

/** Pull a human-readable message out of a failed JSON/text response. */
async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.clone().json();
    if (data && typeof data.message === 'string') return data.message;
  } catch {
    /* not JSON — fall through */
  }
  try {
    const text = await response.text();
    if (text) return text;
  } catch {
    /* ignore */
  }
  return fallback;
}

export const api = {
  baseUrl: API_BASE_URL,

  /** All departments, normalized to { id, code, name } for the dropdown. */
  async getDepartments(): Promise<Department[]> {
    const response = await authGet('/departments');
    if (!response.ok) throw new Error(await readError(response, 'Failed to load departments.'));
    const data = await response.json();
    const list: any[] = Array.isArray(data) ? data : data.departments || data.data || [];
    return list.map((d) => ({
      id: String(d.id ?? d.code ?? d.name),
      code: String(d.code ?? d.id ?? d.name),
      name: String(d.name ?? ''),
      hod: d.hod ?? undefined,
    }));
  },

  /** Staff for a department, with a fallback endpoint for ADMIN/NTF mappings. */
  async getStaffByDepartment(deptCode: string, deptName: string): Promise<Staff[]> {
    const primary = await authGet(`/departments/${encodeURIComponent(deptCode)}/staff-list`);
    if (!primary.ok) throw new Error(await readError(primary, 'Failed to load staff members.'));
    let staff: Staff[] = await primary.json();

    if (!Array.isArray(staff) || staff.length === 0) {
      const fallback = await authGet(`/staff/department/${encodeURIComponent(deptCode)}`);
      if (fallback.ok) {
        const data = await fallback.json();
        if (Array.isArray(data)) {
          staff = data.map((m: any) => {
            const effectiveCode = m.staffCode || m.staffId || m.id || '';
            return {
              id: m.id || effectiveCode,
              staffId: m.staffId || effectiveCode,
              staffCode: effectiveCode,
              name: m.name || '',
              role: m.role || 'Staff',
              phone: m.phone || '',
              email: m.email || '',
              department: m.department || deptName,
            } as Staff;
          });
        }
      }
    }
    return Array.isArray(staff) ? staff : [];
  },

  /** Register a visitor from the public website. */
  async registerVisitor(payload: VisitorRegistration): Promise<VisitorResponse> {
    const response = await fetch(`${API_BASE_URL}/unified-visitors/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readError(response, 'Failed to register. Please try again.'));
    }
    return response.json();
  },

  /** Poll approval status for a website request bound to this machine. */
  async getVisitorStatus(id: number, machineId: string): Promise<VisitorStatus> {
    const response = await fetch(
      `${API_BASE_URL}/unified-visitors/status/${id}?machineId=${encodeURIComponent(machineId)}`
    );
    if (!response.ok) return { success: false };
    return response.json();
  },
};
