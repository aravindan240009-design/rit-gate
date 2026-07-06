import React, { useState, useEffect } from 'react';
import { ECUser, Event, EventPass } from './types';
import { getToken, clearToken, fetchEventPasses } from './services/api';
import { theme } from './theme';
import LoginPage from './components/LoginPage';
import EventListPage from './components/EventListPage';
import AssignCoordinatorsPage from './components/AssignCoordinatorsPage';

type Page = 'login' | 'events' | 'coordinators' | 'passes';

const USER_KEY = 'ec_portal_user';

function loadSavedUser(): ECUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as ECUser;
    if (!getToken()) return null;
    return u;
  } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState<ECUser | null>(loadSavedUser);
  const [page, setPage] = useState<Page>(loadSavedUser() ? 'events' : 'login');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  }, [user]);

  const handleLogin = (u: ECUser) => { setUser(u); setPage('events'); };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setActiveEvent(null);
    setPage('login');
  };

  const handleManageCoordinators = (event: Event) => { setActiveEvent(event); setPage('coordinators'); };
  const handleViewPasses = (event: Event) => { setActiveEvent(event); setPage('passes'); };

  if (page === 'login' || !user) return <LoginPage onLogin={handleLogin} />;

  if (page === 'coordinators' && activeEvent)
    return <AssignCoordinatorsPage user={user} event={activeEvent} onBack={() => setPage('events')} />;

  if (page === 'passes' && activeEvent)
    return <PassesPage user={user} event={activeEvent} onBack={() => setPage('events')} />;

  return (
    <EventListPage
      user={user}
      onManageCoordinators={handleManageCoordinators}
      onViewPasses={handleViewPasses}
      onLogout={handleLogout}
    />
  );
}

// ── Passes page ───────────────────────────────────────────────────────────────

function PassesPage({ user: _user, event, onBack }: { user: ECUser; event: Event; onBack: () => void }) {
  const [passes, setPasses] = useState<EventPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEventPasses(event.id)
      .then(setPasses)
      .catch((e: any) => setError(e.message || 'Failed to load passes'))
      .finally(() => setLoading(false));
  }, [event.id]);

  const filtered = passes.filter(p => {
    const q = search.toLowerCase();
    return !q ||
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.collegeName || '').toLowerCase().includes(q) ||
      (p.manualEntryCode || '').toLowerCase().includes(q);
  });

  const scanned = passes.filter(p => p.entryScannedAt).length;

  const css = `
    .pp-root { min-height:100vh; background:#f1f5f9; font-family:${theme.font.sans}; }
    .pp-topbar { background:${theme.color.brand}; display:flex; align-items:center; gap:14px;
      padding:0 24px; height:60px; box-shadow:0 2px 8px rgba(15,23,42,0.18);
      position:sticky; top:0; z-index:50; }
    .pp-back { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
      border-radius:${theme.radius.pill}; color:#fff; font-size:14px; font-weight:600;
      padding:7px 16px; cursor:pointer; transition:background 0.15s; }
    .pp-back:hover { background:rgba(255,255,255,0.22); }
    .pp-title { font-size:16px; font-weight:800; color:#fff; }
    .pp-sub { font-size:12px; color:rgba(255,255,255,0.6); }
    .pp-main { max-width:960px; margin:0 auto; padding:24px 20px 60px; }
    .pp-stats { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:20px; }
    .pp-stat { background:#fff; border:1px solid ${theme.color.line};
      border-radius:${theme.radius.lg}; padding:16px 22px; flex:1; min-width:140px; }
    .pp-stat-val { font-size:28px; font-weight:800; color:${theme.color.ink}; letter-spacing:-1px; }
    .pp-stat-label { font-size:12px; color:${theme.color.body}; margin-top:2px; font-weight:500; }
    .pp-search { width:100%; padding:10px 14px; border:1.5px solid ${theme.color.line};
      border-radius:${theme.radius.md}; font-size:14px; color:${theme.color.ink};
      background:#fff; outline:none; margin-bottom:16px;
      transition:border-color 0.15s,box-shadow 0.15s; }
    .pp-search:focus { border-color:${theme.color.brandLight}; box-shadow:0 0 0 3px rgba(37,99,235,0.10); }
    .pp-table-wrap { background:#fff; border:1px solid ${theme.color.line};
      border-radius:${theme.radius.lg}; overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:13.5px; }
    th { background:${theme.color.surfaceSunken}; padding:11px 14px; text-align:left;
      font-size:11.5px; font-weight:700; color:${theme.color.muted};
      text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid ${theme.color.line}; }
    td { padding:11px 14px; border-bottom:1px solid ${theme.color.line}; color:${theme.color.ink}; vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tr:hover td { background:${theme.color.surfaceSunken}; }
    .status-badge { display:inline-block; padding:3px 9px; border-radius:${theme.radius.pill}; font-size:11px; font-weight:700; }
    .status-entered { background:${theme.color.successSoft}; color:${theme.color.success}; }
    .status-pending { background:${theme.color.warningSoft}; color:#92400e; }
    .status-exited { background:#f1f5f9; color:${theme.color.muted}; }
    .loader-wrap { display:flex; align-items:center; justify-content:center; padding:60px 0; }
    .spinner-lg { width:36px; height:36px; border:3px solid ${theme.color.line};
      border-top-color:${theme.color.brandLight}; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .error-banner { background:${theme.color.dangerSoft}; border:1px solid #fca5a5;
      border-radius:${theme.radius.md}; padding:14px 18px; font-size:14px; color:#b91c1c; font-weight:500; }
    .empty-state { text-align:center; padding:50px 20px; color:${theme.color.muted}; }
    .empty-icon { font-size:44px; margin-bottom:12px; }
    .hide-mobile { display:table-cell; }
    @media (max-width:640px) { .hide-mobile { display:none; } td,th { padding:9px 10px; } }
  `;

  const statusClass = (p: EventPass) =>
    p.exitScannedAt ? 'status-exited' : p.entryScannedAt ? 'status-entered' : 'status-pending';
  const statusLabel = (p: EventPass) =>
    p.exitScannedAt ? 'EXITED' : p.entryScannedAt ? 'ENTERED' : 'PENDING';

  return (
    <div className="pp-root">
      <style>{css}</style>
      <div className="pp-topbar">
        <button className="pp-back" onClick={onBack}>← Back</button>
        <div>
          <div className="pp-title">Event Passes</div>
          <div className="pp-sub">{event.eventName} · {event.eventDate}</div>
        </div>
      </div>
      <div className="pp-main">
        {!loading && !error && (
          <div className="pp-stats">
            <div className="pp-stat">
              <div className="pp-stat-val">{passes.length}</div>
              <div className="pp-stat-label">Total passes</div>
            </div>
            <div className="pp-stat">
              <div className="pp-stat-val" style={{ color: theme.color.success }}>{scanned}</div>
              <div className="pp-stat-label">Scanned in</div>
            </div>
            <div className="pp-stat">
              <div className="pp-stat-val" style={{ color: theme.color.warning }}>{passes.length - scanned}</div>
              <div className="pp-stat-label">Not yet scanned</div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="loader-wrap"><div className="spinner-lg" /></div>
        ) : error ? (
          <div className="error-banner">⚠️ {error}</div>
        ) : passes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎟️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No passes yet</div>
            <div style={{ fontSize: 14 }}>Coordinators can upload the participant CSV to generate passes.</div>
          </div>
        ) : (
          <>
            <input className="pp-search" placeholder="Search by name, email, college or code…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="pp-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th>
                    <th className="hide-mobile">College</th>
                    <th className="hide-mobile">Dept</th>
                    <th>Code</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ color: theme.color.muted }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.fullName}</div>
                        <div style={{ fontSize: 12, color: theme.color.body }}>{p.email}</div>
                      </td>
                      <td className="hide-mobile">{p.collegeName || '—'}</td>
                      <td className="hide-mobile">{p.department || '—'}</td>
                      <td><code style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{p.manualEntryCode}</code></td>
                      <td><span className={`status-badge ${statusClass(p)}`}>{statusLabel(p)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length < passes.length && (
              <div style={{ marginTop: 10, fontSize: 13, color: theme.color.muted, textAlign: 'center' }}>
                Showing {filtered.length} of {passes.length} passes
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
