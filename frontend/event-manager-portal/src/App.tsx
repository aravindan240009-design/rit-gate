import React, { useState, useEffect } from 'react';
import { ECUser, Event, EventPass } from './types';
import { getToken, clearToken, fetchEventPasses } from './services/api';
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
  const [user,        setUser]        = useState<ECUser | null>(loadSavedUser);
  const [page,        setPage]        = useState<Page>(loadSavedUser() ? 'events' : 'login');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  }, [user]);

  const handleLogin   = (u: ECUser) => { setUser(u); setPage('events'); };
  const handleLogout  = () => { clearToken(); setUser(null); setActiveEvent(null); setPage('login'); };
  const goCoords      = (ev: Event) => { setActiveEvent(ev); setPage('coordinators'); };
  const goPasses      = (ev: Event) => { setActiveEvent(ev); setPage('passes'); };

  if (page === 'login' || !user)
    return <LoginPage onLogin={handleLogin} />;

  if (page === 'coordinators' && activeEvent)
    return <AssignCoordinatorsPage user={user} event={activeEvent} onBack={() => setPage('events')} />;

  if (page === 'passes' && activeEvent)
    return <PassesPage user={user} event={activeEvent} onBack={() => setPage('events')} />;

  return <EventListPage user={user} onManageCoordinators={goCoords} onViewPasses={goPasses} onLogout={handleLogout} />;
}

/* ── Passes Page ──────────────────────────────────────────────────────────── */

function PassesPage({ user: _u, event, onBack }: { user: ECUser; event: Event; onBack: () => void }) {
  const [passes,  setPasses]  = useState<EventPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    fetchEventPasses(event.id)
      .then(setPasses)
      .catch((e: any) => setError(e.message || 'Failed to load passes'))
      .finally(() => setLoading(false));
  }, [event.id]);

  const filtered = passes.filter(p => {
    const q = search.toLowerCase();
    return !q ||
      (p.fullName     || '').toLowerCase().includes(q) ||
      (p.email        || '').toLowerCase().includes(q) ||
      (p.collegeName  || '').toLowerCase().includes(q) ||
      (p.manualEntryCode || '').toLowerCase().includes(q);
  });

  const scanned = passes.filter(p => p.entryScannedAt).length;

  const statusStyle = (p: EventPass): React.CSSProperties => {
    if (p.exitScannedAt)  return { backgroundColor:'#F1F5F9', color:'#475569', border:'1px solid #CBD5E1' };
    if (p.entryScannedAt) return { backgroundColor:'#F0FDF4', color:'#15803D', border:'1px solid #86EFAC' };
    return                       { backgroundColor:'#FFFBEB', color:'#92400E', border:'1px solid #FDE68A' };
  };
  const statusLabel = (p: EventPass) =>
    p.exitScannedAt ? 'EXITED' : p.entryScannedAt ? 'ENTERED' : 'PENDING';

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#FFFFFF',
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

      {/* Topbar */}
      <div style={{ backgroundColor:'#1E293B', display:'flex', alignItems:'center', gap:14,
        padding:'0 24px', height:64, position:'sticky', top:0, zIndex:50,
        boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
        <button onClick={onBack} style={{ backgroundColor:'rgba(255,255,255,0.08)',
          border:'1px solid rgba(255,255,255,0.18)', borderRadius:999,
          color:'#FFFFFF', fontSize:14, fontWeight:600,
          padding:'8px 18px', cursor:'pointer', whiteSpace:'nowrap' }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#FFFFFF' }}>Event Passes</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>
            {event.eventName} · {event.eventDate}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 20px 60px' }}>

        {/* Stats */}
        {!loading && !error && (
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
            {[
              { val: passes.length,          label: 'Total passes',    color: '#000000' },
              { val: scanned,                label: 'Scanned in',      color: '#15803D' },
              { val: passes.length - scanned,label: 'Not yet scanned', color: '#B45309' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0',
                borderRadius:20, padding:'16px 22px', flex:1, minWidth:140,
                boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:30, fontWeight:900, color:s.color, letterSpacing:-1 }}>{s.val}</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:3, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
            <div style={{ width:36, height:36, border:'3px solid #E2E8F0',
              borderTopColor:'#1E293B', borderRadius:'50%',
              animation:'spin 0.7s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FCA5A5',
            borderRadius:14, padding:'14px 18px', fontSize:14, color:'#B91C1C', fontWeight:500 }}>
            ⚠️ {error}
          </div>
        ) : passes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'70px 20px' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🎟️</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#000000', marginBottom:8 }}>No passes yet</div>
            <div style={{ fontSize:14, color:'#64748B' }}>
              Coordinators can upload the participant CSV to generate passes.
            </div>
          </div>
        ) : (
          <>
            <input
              placeholder="Search by name, email, college or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ display:'block', width:'100%', height:52, backgroundColor:'#F8FAFC',
                border:'1px solid #E2E8F0', borderRadius:14, padding:'0 16px',
                fontSize:15, color:'#000000', outline:'none', marginBottom:16 }}
            />

            <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0',
              borderRadius:20, overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
                <thead>
                  <tr>
                    {['#','Name','College','Dept','Code','Status'].map(h => (
                      <th key={h} style={{ backgroundColor:'#F8FAFC', padding:'11px 14px',
                        textAlign:'left', fontSize:11, fontWeight:800, color:'#000000',
                        letterSpacing:0.8, textTransform:'uppercase',
                        borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ transition:'background 0.12s' }}>
                      <td style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9',
                        color:'#94A3B8', fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9' }}>
                        <div style={{ fontWeight:700, color:'#000000' }}>{p.fullName}</div>
                        <div style={{ fontSize:12, color:'#64748B' }}>{p.email}</div>
                      </td>
                      <td style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9', color:'#475569' }}>
                        {p.collegeName||'—'}
                      </td>
                      <td style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9', color:'#475569' }}>
                        {p.department||'—'}
                      </td>
                      <td style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9' }}>
                        <code style={{ fontSize:13, fontWeight:800, letterSpacing:2, color:'#1E293B' }}>
                          {p.manualEntryCode}
                        </code>
                      </td>
                      <td style={{ padding:'11px 14px', borderBottom:'1px solid #F1F5F9' }}>
                        <span style={{ display:'inline-block', padding:'4px 10px',
                          borderRadius:999, fontSize:11, fontWeight:700,
                          ...statusStyle(p) }}>
                          {statusLabel(p)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length < passes.length && (
              <div style={{ marginTop:10, fontSize:13, color:'#94A3B8', textAlign:'center' }}>
                Showing {filtered.length} of {passes.length} passes
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
