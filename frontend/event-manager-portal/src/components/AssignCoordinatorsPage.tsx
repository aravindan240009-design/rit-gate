import React, { useState, useEffect, useCallback } from 'react';
import { Event, ECUser, Staff, Coordinator } from '../types';
import { fetchAllStaff, fetchCoordinators, assignCoordinators, removeCoordinator } from '../services/api';

interface Props { user: ECUser; event: Event; onBack: () => void; }

function initials(name: string) {
  return name.split(' ').map(n => n[0]||'').join('').toUpperCase().slice(0,2) || '??';
}

export default function AssignCoordinatorsPage({ user, event, onBack }: Props) {
  const [allStaff,     setAllStaff]     = useState<Staff[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [deptFilter,   setDeptFilter]   = useState('');
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [assigning,    setAssigning]    = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string|null>(null);
  const [toast,        setToast]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''),3000); };

  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const [staff, coords] = await Promise.all([fetchAllStaff(), fetchCoordinators(event.id)]);
      setAllStaff(staff); setCoordinators(coords);
    } catch(e:any) { setError(e.message||'Failed to load'); }
    finally { setLoading(false); }
  },[event.id]);

  useEffect(()=>{ load(); },[load]);

  const assignedCodes = new Set(coordinators.map(c=>c.staffCode));
  const departments   = Array.from(new Set(allStaff.map(s=>s.department).filter(Boolean))).sort();

  const filtered = allStaff.filter(s => {
    const q = search.toLowerCase();
    const mQ = !q || s.name.toLowerCase().includes(q) || s.staffCode.toLowerCase().includes(q);
    const mD = !deptFilter || s.department === deptFilter;
    return mQ && mD;
  });

  const toggle = (code: string) => {
    if (assignedCodes.has(code)) return;
    setSelected(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  };

  const handleAssign = async () => {
    const toAdd = Array.from(selected).filter(c => !assignedCodes.has(c));
    if (!toAdd.length) return;
    setAssigning(true);
    try {
      const { assigned, alreadyAssigned } = await assignCoordinators(event.id, toAdd, user.username);
      setSelected(new Set());
      await load();
      if (assigned > 0 && alreadyAssigned > 0) {
        showToast(`✅ ${assigned} assigned · ${alreadyAssigned} already assigned`);
      } else if (assigned > 0) {
        showToast(`✅ ${assigned} coordinator${assigned > 1 ? 's' : ''} assigned — notification sent`);
      } else {
        showToast(`ℹ️ All selected staff were already assigned`);
      }
    } catch(e:any) { showToast('❌ ' + (e.message || 'Failed to assign')); }
    finally { setAssigning(false); }
  };

  const handleRemove = async (code: string) => {
    setRemoveTarget(null);
    try { await removeCoordinator(event.id, code); await load(); showToast('🗑️ Coordinator removed'); }
    catch(e:any) { showToast('❌ '+(e.message||'Failed')); }
  };

  return (
    <div style={S.root}>
      {/* Topbar */}
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={onBack}>← Back</button>
        <div>
          <div style={S.topTitle}>Assign Coordinators</div>
          <div style={S.topSub}>{event.eventName}</div>
        </div>
      </div>

      <div style={S.main}>
        {/* Event strip */}
        <div style={S.eventStrip}>
          <span style={{fontSize:22}}>📅</span>
          <div>
            <div style={S.stripName}>{event.eventName}</div>
            <div style={S.stripMeta}>{event.eventDate} · {event.venue}</div>
          </div>
        </div>

        {loading ? (
          <div style={S.loaderWrap}><div style={S.spinner}/></div>
        ) : error ? (
          <div style={S.errorBox}>⚠️ {error}</div>
        ) : (
          <>
            {/* Current coordinators */}
            {coordinators.length > 0 && (
              <div style={{marginBottom:24}}>
                <div style={S.sectionLabel}>ASSIGNED COORDINATORS ({coordinators.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {coordinators.map(c => (
                    <div key={c.id} style={S.coordRow}>
                      <div style={S.avatar}>{initials(c.staffName||c.staffCode)}</div>
                      <div style={{flex:1}}>
                        <div style={S.coordName}>{c.staffName||c.staffCode}</div>
                        <div style={S.coordMeta}>{c.staffCode}</div>
                      </div>
                      <button style={S.removeBtn} onClick={()=>setRemoveTarget(c.staffCode)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search + filter */}
            <div style={S.sectionLabel}>ALL TEACHING STAFF ({allStaff.length})</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
              <input style={{...S.searchInput,flex:1,minWidth:200}}
                placeholder="Search by name or staff code…"
                value={search} onChange={e=>setSearch(e.target.value)} />
              <select style={S.select} value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{fontSize:40,marginBottom:10}}>🔍</div>
                <div style={{fontSize:15,fontWeight:700,color:'#000'}}>No staff match your search.</div>
              </div>
            ) : (
              <div style={S.staffList}>
                {filtered.map(s => {
                  const isAssigned = assignedCodes.has(s.staffCode);
                  const isSelected = selected.has(s.staffCode);
                  return (
                    <div key={s.staffCode}
                      style={{...S.staffRow, cursor: isAssigned?'default':'pointer',
                        backgroundColor: isAssigned?'#F8FAFC':'#FFFFFF'}}
                      onClick={()=>toggle(s.staffCode)}>
                      <div style={{...S.checkbox,
                        backgroundColor: isAssigned?'#1E293B': isSelected?'#1E293B':'transparent',
                        borderColor: isAssigned||isSelected?'#1E293B':'#E2E8F0'}}>
                        {(isAssigned||isSelected) && <span style={{color:'#fff',fontSize:12}}>✓</span>}
                      </div>
                      <div style={{...S.avatar,width:34,height:34,fontSize:12}}>
                        {initials(s.name)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={S.staffName}>{s.name}</div>
                        <div style={S.staffMeta}>{s.staffCode} · {s.department}</div>
                      </div>
                      {isAssigned && <span style={S.assignedTag}>Assigned</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky assign footer */}
      {selected.size > 0 && (
        <div style={S.footer} className="fade-in">
          <span style={S.selectedLabel}>{selected.size} staff selected</span>
          <button style={{...S.assignBtn,opacity:assigning?0.7:1}} onClick={handleAssign} disabled={assigning}>
            {assigning ? 'Assigning…' : `Assign ${selected.size} Coordinator${selected.size>1?'s':''}`}
          </button>
        </div>
      )}

      {/* Remove modal */}
      {removeTarget && (
        <div style={S.overlay} onClick={()=>setRemoveTarget(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()} className="fade-in">
            <div style={S.modalIconWrap}><span style={{fontSize:26}}>👥</span></div>
            <h3 style={S.modalTitle}>Remove Coordinator</h3>
            <p style={S.modalMsg}>Remove <strong>{removeTarget}</strong> from <strong>"{event.eventName}"</strong>?</p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button style={S.ghostBtn} onClick={()=>setRemoveTarget(null)}>Cancel</button>
              <button style={S.dangerBtn} onClick={()=>handleRemove(removeTarget)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight:'100vh', backgroundColor:'#FFFFFF',
    fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },

  topbar: { backgroundColor:'#1E293B', display:'flex', alignItems:'center', gap:14,
    padding:'0 24px', height:64, position:'sticky', top:0, zIndex:50,
    boxShadow:'0 2px 12px rgba(0,0,0,0.15)' },
  backBtn: { backgroundColor:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.18)',
    borderRadius:999, color:'#FFFFFF', fontSize:14, fontWeight:600,
    padding:'8px 18px', cursor:'pointer', whiteSpace:'nowrap' },
  topTitle: { fontSize:16, fontWeight:800, color:'#FFFFFF', letterSpacing:-0.2 },
  topSub:   { fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:1 },

  main: { maxWidth:900, margin:'0 auto', padding:'24px 20px 100px' },

  eventStrip: { backgroundColor:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:20,
    padding:'14px 18px', display:'flex', alignItems:'center', gap:12, marginBottom:24 },
  stripName: { fontSize:15, fontWeight:700, color:'#000000' },
  stripMeta: { fontSize:13, color:'#64748B', marginTop:2 },

  sectionLabel: { fontSize:11, fontWeight:800, color:'#000000', letterSpacing:1,
    marginBottom:12, textTransform:'uppercase' },

  coordRow: { display:'flex', alignItems:'center', gap:12, backgroundColor:'#FFFFFF',
    border:'1px solid #E2E8F0', borderRadius:18, padding:'12px 16px' },
  avatar: { width:40, height:40, borderRadius:'50%', backgroundColor:'#F1F5F9',
    border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:800, color:'#1E293B', flexShrink:0 },
  coordName: { fontSize:14, fontWeight:700, color:'#000000' },
  coordMeta: { fontSize:12, color:'#64748B' },
  removeBtn: { backgroundColor:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10,
    color:'#B91C1C', fontSize:12, fontWeight:600, padding:'6px 14px', cursor:'pointer' },

  searchInput: { height:48, backgroundColor:'#F8FAFC', border:'1px solid #E2E8F0',
    borderRadius:14, padding:'0 14px', fontSize:14, color:'#000000', outline:'none' },
  select: { height:48, backgroundColor:'#F8FAFC', border:'1px solid #E2E8F0',
    borderRadius:14, padding:'0 14px', fontSize:14, color:'#000000', outline:'none', cursor:'pointer' },

  staffList: { backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0',
    borderRadius:20, overflow:'hidden' },
  staffRow: { display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
    borderBottom:'1px solid #F1F5F9', transition:'background 0.12s' },
  checkbox: { width:22, height:22, borderRadius:7, border:'2px solid #E2E8F0',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0, transition:'background 0.12s, border-color 0.12s' },
  staffName: { fontSize:14, fontWeight:600, color:'#000000' },
  staffMeta: { fontSize:12, color:'#64748B' },
  assignedTag: { backgroundColor:'#F0FDF4', border:'1px solid #86EFAC',
    borderRadius:999, color:'#15803D', fontSize:11, fontWeight:700,
    padding:'3px 10px', whiteSpace:'nowrap' },

  emptyState: { textAlign:'center', padding:'40px 20px', color:'#94A3B8' },

  loaderWrap: { display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0' },
  spinner: { width:36, height:36, border:'3px solid #E2E8F0', borderTopColor:'#1E293B',
    borderRadius:'50%', animation:'spin 0.7s linear infinite' },
  errorBox: { backgroundColor:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:14,
    padding:'14px 18px', fontSize:14, color:'#B91C1C', fontWeight:500 },

  footer: { position:'fixed', bottom:0, left:0, right:0, padding:'14px 24px',
    backgroundColor:'#FFFFFF', borderTop:'1px solid #E2E8F0',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    boxShadow:'0 -4px 20px rgba(0,0,0,0.07)', zIndex:40 },
  selectedLabel: { fontSize:14, fontWeight:600, color:'#64748B' },
  assignBtn: { height:48, padding:'0 28px', backgroundColor:'#1E293B', color:'#FFFFFF',
    border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
    boxShadow:'0 4px 12px rgba(0,0,0,0.12)', transition:'opacity 0.15s' },

  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.5)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 },
  modal: { backgroundColor:'#FFFFFF', borderRadius:28, padding:28,
    maxWidth:380, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.18)' },
  modalIconWrap: { width:56, height:56, borderRadius:16, backgroundColor:'#F1F5F9',
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 },
  modalTitle: { fontSize:20, fontWeight:800, color:'#000000', margin:'0 0 10px' },
  modalMsg:   { fontSize:14, color:'#64748B', lineHeight:1.6, margin:'0 0 22px' },
  ghostBtn: { height:44, padding:'0 20px', backgroundColor:'transparent', color:'#475569',
    border:'1.5px solid #E2E8F0', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' },
  dangerBtn: { height:44, padding:'0 22px', backgroundColor:'#EF4444', color:'#FFFFFF',
    border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' },

  toast: { position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
    backgroundColor:'#1E293B', color:'#FFFFFF', padding:'12px 26px',
    borderRadius:999, fontSize:14, fontWeight:600,
    boxShadow:'0 8px 24px rgba(0,0,0,0.18)', zIndex:999,
    animation:'fadeIn 0.22s ease both' },
};
