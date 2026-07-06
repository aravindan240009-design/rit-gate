import React, { useState, useEffect, useCallback } from 'react';
import { Event, ECUser } from '../types';
import { fetchAllEvents, createEvent, deleteEvent } from '../services/api';

interface Props {
  user: ECUser;
  onManageCoordinators: (event: Event) => void;
  onViewPasses: (event: Event) => void;
  onLogout: () => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDate(iso: string) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m)-1]} ${y}`;
}

const STATUS: Record<string,{bg:string;text:string;border:string}> = {
  ACTIVE:    { bg:'#DCFCE7', text:'#15803D', border:'#86EFAC' },
  COMPLETED: { bg:'#F1F5F9', text:'#475569', border:'#CBD5E1' },
  CANCELLED: { bg:'#FEE2E2', text:'#B91C1C', border:'#FCA5A5' },
};

export default function EventListPage({ user, onManageCoordinators, onViewPasses, onLogout }: Props) {
  const [events,       setEvents]       = useState<Event[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [cName,        setCName]        = useState('');
  const [cDate,        setCDate]        = useState('');
  const [cVenue,       setCVenue]       = useState('');
  const [cLoading,     setCLoading]     = useState(false);
  const [cError,       setCError]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Event|null>(null);
  const [delLoading,   setDelLoading]   = useState(false);
  const [toast,        setToast]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''),3000); };

  const load = useCallback(async () => {
    setError('');
    try { setEvents(await fetchAllEvents()); }
    catch(e:any) { setError(e.message||'Failed to load events'); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCError('');
    if (!cName.trim())  { setCError('Event name is required.'); return; }
    if (!cDate)         { setCError('Event date is required.'); return; }
    if (!cVenue.trim()) { setCError('Venue is required.'); return; }
    if (cDate < todayISO()) { setCError('Event date must be today or in the future.'); return; }
    setCLoading(true);
    try {
      await createEvent(user.username, cName.trim(), cDate, cVenue.trim());
      setCName(''); setCDate(''); setCVenue('');
      setShowCreate(false); await load();
      showToast('✅ Event created');
    } catch(err:any) { setCError(err.message||'Failed to create event'); }
    finally { setCLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDelLoading(true);
    try {
      await deleteEvent(deleteTarget.id, user.username);
      setDeleteTarget(null); await load(); showToast('🗑️ Event deleted');
    } catch(err:any) { setDeleteTarget(null); showToast('❌ '+(err.message||'Failed')); }
    finally { setDelLoading(false); }
  };

  return (
    <div style={S.root}>
      {/* ── Topbar ── */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <div style={S.topLogoWrap}><span style={{fontSize:22}}>🎫</span></div>
          <div>
            <div style={S.topTitle}>RIT GATE</div>
            <div style={S.topSub}>EVENT CONTROLLER PORTAL</div>
          </div>
        </div>
        <div style={S.topRight}>
          <span style={S.topUser}>👤 {user.displayName}</span>
          <button style={S.logoutBtn} onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div style={S.main}>
        {/* ── Section header ── */}
        <div style={S.sectionHead}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <h2 style={S.sectionTitle}>All Events</h2>
            {!loading && <span style={S.countBadge}>{events.length}</span>}
          </div>
          <button style={S.createBtn} onClick={()=>{ setShowCreate(v=>!v); setCError(''); }}>
            {showCreate ? '✕ Cancel' : '+ New Event'}
          </button>
        </div>

        {/* ── Create form ── */}
        {showCreate && (
          <div style={S.card} className="fade-in">
            <h3 style={S.cardTitle}>Create New Event</h3>
            <form onSubmit={handleCreate} noValidate>
              <label style={S.label}>EVENT NAME</label>
              <input style={S.input} placeholder="e.g. National Level Symposium 2026"
                value={cName} onChange={e=>setCName(e.target.value)} disabled={cLoading} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
                <div>
                  <label style={S.label}>EVENT DATE</label>
                  <input style={S.input} type="date" min={todayISO()}
                    value={cDate} onChange={e=>setCDate(e.target.value)} disabled={cLoading} />
                </div>
                <div>
                  <label style={S.label}>VENUE</label>
                  <input style={S.input} placeholder="e.g. Seminar Hall, Block A"
                    value={cVenue} onChange={e=>setCVenue(e.target.value)} disabled={cLoading} />
                </div>
              </div>
              {cError && <div style={S.errorBox}>{cError}</div>}
              <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:18}}>
                <button type="button" style={S.ghostBtn}
                  onClick={()=>{ setShowCreate(false); setCError(''); }}>Cancel</button>
                <button type="submit" style={{...S.btn, opacity:cLoading?0.7:1}} disabled={cLoading}>
                  {cLoading ? 'Creating…' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={S.errorBox}>
            ⚠️ {error}
            <button style={{...S.ghostBtn,marginLeft:'auto',padding:'6px 14px',fontSize:12}}
              onClick={load}>Retry</button>
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div style={S.loaderWrap}><div style={S.spinner} /></div>
        ) : events.length === 0 && !error ? (
          <div style={S.emptyState}>
            <div style={{fontSize:52,marginBottom:14}}>📅</div>
            <div style={S.emptyTitle}>No events yet</div>
            <div style={S.emptySub}>Create your first event using the button above.</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:1,border:'1px solid #E2E8F0',borderRadius:20,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
            {events.map((ev, idx) => {
              const sc = STATUS[ev.status] ?? STATUS.ACTIVE;
              return (
                <div key={ev.id} style={{...S.eventCard, borderRadius:0,
                  borderBottom: idx < events.length-1 ? '1px solid #F1F5F9' : 'none',
                  boxShadow:'none'}} className="fade-in">

                  {/* Top row: name + status badge */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,marginBottom:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                      <div style={{width:38,height:38,borderRadius:10,backgroundColor:'#F1F5F9',
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={S.eventName}>{ev.eventName}</div>
                        <div style={{fontSize:12,color:'#94A3B8',fontWeight:500,marginTop:1}}>{ev.createdByHod}</div>
                      </div>
                    </div>
                    <span style={{...S.badge, background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`, flexShrink:0}}>
                      {ev.status}
                    </span>
                  </div>

                  {/* Meta chips */}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                    <span style={S.metaChip}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {fmtDate(ev.eventDate)}
                    </span>
                    <span style={S.metaChip}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {ev.venue || 'No venue'}
                    </span>
                  </div>

                  {/* Divider */}
                  <div style={{height:1,backgroundColor:'#F1F5F9',margin:'0 0 14px'}} />

                  {/* Action row */}
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <button style={S.actionBtnPrimary} onClick={()=>onManageCoordinators(ev)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Coordinators
                    </button>
                    <button style={S.actionBtnSecondary} onClick={()=>onViewPasses(ev)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
                      View Passes
                    </button>
                    <button style={{...S.actionBtnDanger}} onClick={()=>setDeleteTarget(ev)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div style={S.overlay} onClick={()=>!delLoading&&setDeleteTarget(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()} className="fade-in">
            <div style={S.modalIconWrap}><span style={{fontSize:28}}>🗑️</span></div>
            <h3 style={S.modalTitle}>Delete Event</h3>
            <p style={S.modalMsg}>
              Delete <strong>"{deleteTarget.eventName}"</strong>? All coordinators will be notified and all passes removed. This cannot be undone.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button style={S.ghostBtn} onClick={()=>setDeleteTarget(null)} disabled={delLoading}>Cancel</button>
              <button style={{...S.dangerBtn,opacity:delLoading?0.7:1}} onClick={handleDelete} disabled={delLoading}>
                {delLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight:'100vh', backgroundColor:'#FFFFFF', fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },

  topbar: { backgroundColor:'#1E293B', display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 24px', height:64, position:'sticky', top:0, zIndex:50,
    boxShadow:'0 2px 12px rgba(0,0,0,0.15)' },
  topLeft: { display:'flex', alignItems:'center', gap:12 },
  topLogoWrap: { width:40, height:40, borderRadius:12, backgroundColor:'rgba(255,255,255,0.1)',
    display:'flex', alignItems:'center', justifyContent:'center' },
  topTitle: { fontSize:17, fontWeight:800, color:'#FFFFFF', letterSpacing:1 },
  topSub:   { fontSize:10, color:'rgba(255,255,255,0.55)', letterSpacing:1.2, fontWeight:600 },
  topRight: { display:'flex', alignItems:'center', gap:14 },
  topUser:  { fontSize:13, color:'rgba(255,255,255,0.7)', fontWeight:500 },
  logoutBtn:{ padding:'8px 18px', backgroundColor:'rgba(255,255,255,0.08)',
    border:'1px solid rgba(255,255,255,0.18)', borderRadius:999,
    color:'#FFFFFF', fontSize:13, fontWeight:600, cursor:'pointer', transition:'background 0.15s' },

  main: { maxWidth:900, margin:'0 auto', padding:'28px 20px 80px' },

  sectionHead: { display:'flex', alignItems:'center', justifyContent:'space-between',
    marginBottom:22, flexWrap:'wrap', gap:12 },
  sectionTitle:{ fontSize:22, fontWeight:800, color:'#000000', letterSpacing:-0.3, margin:0 },
  countBadge:  { display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:28, height:24, padding:'0 8px',
    backgroundColor:'#F1F5F9', border:'1px solid #E2E8F0',
    borderRadius:999, fontSize:12, fontWeight:700, color:'#475569' },
  createBtn:   { height:48, padding:'0 22px', backgroundColor:'#1E293B', color:'#FFFFFF',
    border:'none', borderRadius:16, fontSize:14, fontWeight:700,
    cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', transition:'opacity 0.15s' },

  card: { backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:24,
    padding:24, marginBottom:24, boxShadow:'0 8px 24px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize:17, fontWeight:800, color:'#000000', margin:'0 0 18px' },
  label: { display:'block', fontSize:11, fontWeight:800, color:'#000000',
    letterSpacing:1, marginBottom:8 },
  input: { display:'block', width:'100%', height:52, backgroundColor:'#F8FAFC',
    border:'1px solid #E2E8F0', borderRadius:14, padding:'0 14px',
    fontSize:15, color:'#000000', outline:'none', transition:'border-color 0.15s' },
  errorBox: { backgroundColor:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:12,
    padding:'10px 14px', fontSize:13.5, color:'#B91C1C', fontWeight:500,
    marginTop:12, display:'flex', alignItems:'center', gap:8 },
  btn: { height:48, padding:'0 24px', backgroundColor:'#1E293B', color:'#FFFFFF',
    border:'none', borderRadius:14, fontSize:15, fontWeight:700,
    cursor:'pointer', transition:'opacity 0.15s' },
  ghostBtn: { height:48, padding:'0 20px', backgroundColor:'transparent', color:'#475569',
    border:'1.5px solid #E2E8F0', borderRadius:14, fontSize:14,
    fontWeight:600, cursor:'pointer', transition:'border-color 0.15s' },

  loaderWrap: { display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' },
  spinner: { width:36, height:36, border:'3px solid #E2E8F0', borderTopColor:'#1E293B',
    borderRadius:'50%', animation:'spin 0.7s linear infinite' },

  emptyState: { textAlign:'center', padding:'70px 20px' },
  emptyTitle: { fontSize:18, fontWeight:700, color:'#000000', marginBottom:8 },
  emptySub:   { fontSize:14, color:'#64748B' },

  eventCard: { backgroundColor:'#FFFFFF', padding:'20px 22px',
    transition:'background 0.15s' },
  eventName: { fontSize:16, fontWeight:800, color:'#0F172A', letterSpacing:-0.2 },
  badge: { display:'inline-block', padding:'3px 10px', borderRadius:999,
    fontSize:11, fontWeight:700, letterSpacing:0.4, whiteSpace:'nowrap' },
  metaChip: { display:'inline-flex', alignItems:'center', gap:5,
    backgroundColor:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8,
    padding:'4px 10px', fontSize:12, fontWeight:500, color:'#475569' },
  actionBtnPrimary: { display:'inline-flex', alignItems:'center', gap:7,
    height:36, padding:'0 16px',
    backgroundColor:'#1E293B', color:'#FFFFFF',
    border:'none', borderRadius:9, fontSize:13, fontWeight:600,
    cursor:'pointer', letterSpacing:0.1 },
  actionBtnSecondary: { display:'inline-flex', alignItems:'center', gap:7,
    height:36, padding:'0 16px',
    backgroundColor:'#F8FAFC', color:'#1E293B',
    border:'1.5px solid #E2E8F0', borderRadius:9, fontSize:13, fontWeight:600,
    cursor:'pointer' },
  actionBtnDanger: { display:'inline-flex', alignItems:'center', gap:7,
    height:36, padding:'0 16px', marginLeft:'auto',
    backgroundColor:'#FEF2F2', color:'#B91C1C',
    border:'1.5px solid #FECACA', borderRadius:9, fontSize:13, fontWeight:600,
    cursor:'pointer' },

  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.5)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 },
  modal: { backgroundColor:'#FFFFFF', borderRadius:28, padding:28,
    maxWidth:400, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.18)' },
  modalIconWrap: { width:58, height:58, borderRadius:18, backgroundColor:'#FEE2E2',
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  modalTitle: { fontSize:20, fontWeight:800, color:'#000000', margin:'0 0 10px' },
  modalMsg:   { fontSize:14, color:'#64748B', lineHeight:1.6, margin:'0 0 22px' },
  dangerBtn:  { height:48, padding:'0 24px', backgroundColor:'#EF4444', color:'#FFFFFF',
    border:'none', borderRadius:14, fontSize:14, fontWeight:700,
    cursor:'pointer', transition:'opacity 0.15s' },

  toast: { position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)',
    backgroundColor:'#1E293B', color:'#FFFFFF', padding:'12px 26px',
    borderRadius:999, fontSize:14, fontWeight:600,
    boxShadow:'0 8px 24px rgba(0,0,0,0.18)', zIndex:999,
    animation:'fadeIn 0.22s ease both' },
};
