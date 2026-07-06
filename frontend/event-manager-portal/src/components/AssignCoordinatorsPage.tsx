import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../theme';
import { Event, ECUser, Staff, Coordinator } from '../types';
import { fetchAllStaff, fetchCoordinators, assignCoordinators, removeCoordinator } from '../services/api';

interface Props {
  user: ECUser;
  event: Event;
  onBack: () => void;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

export default function AssignCoordinatorsPage({ user, event, onBack }: Props) {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const [staff, coords] = await Promise.all([fetchAllStaff(), fetchCoordinators(event.id)]);
      setAllStaff(staff);
      setCoordinators(coords);
    } catch (e: any) { setError(e.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [event.id]);

  useEffect(() => { load(); }, [load]);

  const assignedCodes = new Set(coordinators.map(c => c.staffCode));
  const departments = Array.from(new Set(allStaff.map(s => s.department).filter(Boolean))).sort();

  const filtered = allStaff.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.staffCode.toLowerCase().includes(q);
    const matchD = !deptFilter || s.department === deptFilter;
    return matchQ && matchD;
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
      await assignCoordinators(event.id, toAdd, user.username);
      setSelected(new Set());
      await load();
      showToast(`✅ ${toAdd.length} coordinator${toAdd.length > 1 ? 's' : ''} assigned`);
    } catch (e: any) { showToast('❌ ' + (e.message || 'Failed to assign')); }
    finally { setAssigning(false); }
  };

  const handleRemove = async (code: string) => {
    setRemoveTarget(null);
    try {
      await removeCoordinator(event.id, code);
      await load();
      showToast('🗑️ Coordinator removed');
    } catch (e: any) { showToast('❌ ' + (e.message || 'Failed to remove')); }
  };

  const css = `
    .ac-root { min-height:100vh; background:#f1f5f9; font-family:${theme.font.sans}; }
    .ac-topbar { background:${theme.color.brand}; display:flex; align-items:center; gap:14px;
      padding:0 24px; height:60px; box-shadow:0 2px 8px rgba(15,23,42,0.18); position:sticky; top:0; z-index:50; }
    .ac-back { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
      border-radius:${theme.radius.pill}; color:#fff; font-size:14px; font-weight:600;
      padding:7px 16px; cursor:pointer; transition:background 0.15s; display:flex; align-items:center; gap:6px; }
    .ac-back:hover { background:rgba(255,255,255,0.22); }
    .ac-topbar-title { font-size:16px; font-weight:800; color:#fff; letter-spacing:-0.2px; }
    .ac-topbar-sub { font-size:12px; color:rgba(255,255,255,0.6); }
    .ac-main { max-width:900px; margin:0 auto; padding:24px 20px 80px; display:flex; flex-direction:column; gap:20px; }
    .ac-event-strip { background:#fff; border:1px solid ${theme.color.line}; border-radius:${theme.radius.lg};
      padding:14px 18px; display:flex; align-items:center; gap:10px; }
    .ac-event-name { font-size:15px; font-weight:700; color:${theme.color.ink}; }
    .ac-event-meta { font-size:13px; color:${theme.color.body}; margin-top:2px; }
    .ac-section-title { font-size:14px; font-weight:700; color:${theme.color.body};
      text-transform:uppercase; letter-spacing:0.6px; margin-bottom:12px; }
    .ac-coord-list { display:flex; flex-direction:column; gap:8px; }
    .ac-coord-row { display:flex; align-items:center; gap:12px; background:#fff;
      border:1px solid ${theme.color.line}; border-radius:${theme.radius.md}; padding:12px 16px; }
    .ac-avatar { width:38px; height:38px; border-radius:50%; background:${theme.color.brandSoft};
      display:flex; align-items:center; justify-content:center; font-size:13px;
      font-weight:800; color:${theme.color.brandLight}; flex-shrink:0; }
    .ac-coord-name { font-size:14px; font-weight:700; color:${theme.color.ink}; }
    .ac-coord-meta { font-size:12px; color:${theme.color.body}; }
    .ac-remove-btn { margin-left:auto; background:${theme.color.dangerSoft}; border:1px solid #fca5a5;
      border-radius:${theme.radius.sm}; color:${theme.color.danger}; font-size:12px;
      font-weight:600; padding:5px 12px; cursor:pointer; transition:background 0.15s; }
    .ac-remove-btn:hover { background:#fecaca; }
    .ac-controls { display:flex; gap:10px; flex-wrap:wrap; }
    .ac-search { flex:1; min-width:200px; padding:10px 14px; border:1.5px solid ${theme.color.line};
      border-radius:${theme.radius.md}; font-size:14px; color:${theme.color.ink};
      background:${theme.color.surfaceAlt}; outline:none; transition:border-color 0.15s,box-shadow 0.15s; }
    .ac-search:focus { border-color:${theme.color.brandLight}; box-shadow:0 0 0 3px rgba(37,99,235,0.10); background:#fff; }
    .ac-dept-select { padding:10px 14px; border:1.5px solid ${theme.color.line};
      border-radius:${theme.radius.md}; font-size:14px; color:${theme.color.ink};
      background:${theme.color.surfaceAlt}; outline:none; cursor:pointer;
      transition:border-color 0.15s; }
    .ac-dept-select:focus { border-color:${theme.color.brandLight}; }
    .ac-staff-list { display:flex; flex-direction:column; background:#fff;
      border:1px solid ${theme.color.line}; border-radius:${theme.radius.lg}; overflow:hidden; }
    .ac-staff-row { display:flex; align-items:center; gap:12px; padding:12px 16px;
      border-bottom:1px solid ${theme.color.line}; cursor:pointer; transition:background 0.12s; }
    .ac-staff-row:last-child { border-bottom:none; }
    .ac-staff-row:hover:not(.is-assigned) { background:${theme.color.surfaceSunken}; }
    .ac-staff-row.is-assigned { cursor:default; }
    .ac-cb { width:20px; height:20px; border-radius:6px; border:2px solid ${theme.color.line};
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
      transition:background 0.12s,border-color 0.12s; font-size:12px; }
    .ac-cb.checked { background:${theme.color.brandLight}; border-color:${theme.color.brandLight}; color:#fff; }
    .ac-cb.assigned { background:${theme.color.success}; border-color:${theme.color.success}; color:#fff; }
    .ac-staff-name { font-size:14px; font-weight:600; color:${theme.color.ink}; }
    .ac-staff-meta { font-size:12px; color:${theme.color.body}; }
    .ac-assigned-tag { margin-left:auto; background:${theme.color.successSoft}; border-radius:${theme.radius.pill};
      color:${theme.color.success}; font-size:11px; font-weight:700; padding:3px 10px; white-space:nowrap; }
    .ac-footer { position:fixed; bottom:0; left:0; right:0; padding:14px 24px;
      background:#fff; border-top:1px solid ${theme.color.line};
      display:flex; align-items:center; justify-content:space-between;
      box-shadow:0 -4px 12px rgba(15,23,42,0.08); z-index:40; }
    .ac-selected-label { font-size:14px; font-weight:600; color:${theme.color.body}; }
    .ac-assign-btn { padding:11px 28px; background:${theme.color.brand}; color:#fff;
      border:none; border-radius:${theme.radius.md}; font-size:14px; font-weight:700;
      cursor:pointer; display:inline-flex; align-items:center; gap:8px;
      transition:background 0.15s; }
    .ac-assign-btn:hover:not(:disabled) { background:${theme.color.brandMid}; }
    .ac-assign-btn:disabled { opacity:0.6; cursor:not-allowed; }
    .spinner { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.35);
      border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .loader-wrap { display:flex; align-items:center; justify-content:center; padding:60px 0; }
    .spinner-lg { width:36px; height:36px; border:3px solid ${theme.color.line};
      border-top-color:${theme.color.brandLight}; border-radius:50%; animation:spin 0.7s linear infinite; }
    .error-banner { background:${theme.color.dangerSoft}; border:1px solid #fca5a5;
      border-radius:${theme.radius.md}; padding:14px 18px; font-size:14px; color:#b91c1c; font-weight:500; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,0.5);
      display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
    .modal-card { background:#fff; border-radius:${theme.radius.xl}; padding:28px;
      max-width:380px; width:100%; box-shadow:${theme.shadow.lg}; }
    .modal-title { font-size:17px; font-weight:800; color:${theme.color.ink}; margin-bottom:10px; }
    .modal-msg { font-size:14px; color:${theme.color.body}; line-height:1.6; margin-bottom:22px; }
    .modal-actions { display:flex; gap:10px; justify-content:flex-end; }
    .btn-ghost { padding:9px 18px; background:transparent; color:${theme.color.body};
      border:1.5px solid ${theme.color.line}; border-radius:${theme.radius.md};
      font-size:14px; font-weight:600; cursor:pointer; transition:border-color 0.15s; }
    .btn-ghost:hover { border-color:${theme.color.brandLight}; color:${theme.color.ink}; }
    .btn-danger { padding:9px 20px; background:${theme.color.danger}; color:#fff;
      border:none; border-radius:${theme.radius.md}; font-size:14px; font-weight:700; cursor:pointer; transition:background 0.15s; }
    .btn-danger:hover { background:#dc2626; }
    .toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
      background:${theme.color.ink}; color:#fff; padding:12px 24px;
      border-radius:${theme.radius.pill}; font-size:14px; font-weight:600;
      box-shadow:${theme.shadow.lg}; z-index:999;
      animation:slideUp 0.22s ease both; }
    @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    .empty-state { text-align:center; padding:40px 20px; color:${theme.color.muted}; }
    .empty-icon { font-size:40px; margin-bottom:10px; }
  `;

  return (
    <div className="ac-root">
      <style>{css}</style>

      {/* Topbar */}
      <div className="ac-topbar">
        <button className="ac-back" onClick={onBack}>← Back</button>
        <div>
          <div className="ac-topbar-title">Assign Coordinators</div>
          <div className="ac-topbar-sub">Select staff to coordinate this event</div>
        </div>
      </div>

      <div className="ac-main">
        {/* Event strip */}
        <div className="ac-event-strip">
          <span style={{ fontSize: 22 }}>📅</span>
          <div>
            <div className="ac-event-name">{event.eventName}</div>
            <div className="ac-event-meta">{event.eventDate} · {event.venue}</div>
          </div>
        </div>

        {loading ? (
          <div className="loader-wrap"><div className="spinner-lg" /></div>
        ) : error ? (
          <div className="error-banner">⚠️ {error}</div>
        ) : (
          <>
            {/* Current coordinators */}
            {coordinators.length > 0 && (
              <div>
                <div className="ac-section-title">Assigned Coordinators ({coordinators.length})</div>
                <div className="ac-coord-list">
                  {coordinators.map(c => (
                    <div key={c.id} className="ac-coord-row">
                      <div className="ac-avatar">{initials(c.staffName || c.staffCode)}</div>
                      <div>
                        <div className="ac-coord-name">{c.staffName || c.staffCode}</div>
                        <div className="ac-coord-meta">{c.staffCode}</div>
                      </div>
                      <button className="ac-remove-btn" onClick={() => setRemoveTarget(c.staffCode)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search + filter */}
            <div>
              <div className="ac-section-title">All Teaching Staff ({allStaff.length})</div>
              <div className="ac-controls" style={{ marginBottom: 12 }}>
                <input className="ac-search" placeholder="Search by name or staff code…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                <select className="ac-dept-select" value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <div>No staff match your search.</div>
                </div>
              ) : (
                <div className="ac-staff-list">
                  {filtered.map(s => {
                    const isAssigned = assignedCodes.has(s.staffCode);
                    const isSelected = selected.has(s.staffCode);
                    return (
                      <div key={s.staffCode}
                        className={`ac-staff-row${isAssigned ? ' is-assigned' : ''}`}
                        onClick={() => toggle(s.staffCode)}>
                        <div className={`ac-cb${isAssigned ? ' assigned' : isSelected ? ' checked' : ''}`}>
                          {(isAssigned || isSelected) && '✓'}
                        </div>
                        <div className="ac-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                          {initials(s.name)}
                        </div>
                        <div>
                          <div className="ac-staff-name">{s.name}</div>
                          <div className="ac-staff-meta">{s.staffCode} · {s.department}</div>
                        </div>
                        {isAssigned && <span className="ac-assigned-tag">Assigned</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky assign footer */}
      {selected.size > 0 && (
        <div className="ac-footer fade-in">
          <span className="ac-selected-label">{selected.size} staff selected</span>
          <button className="ac-assign-btn" onClick={handleAssign} disabled={assigning}>
            {assigning
              ? <><span className="spinner" />Assigning…</>
              : `Assign ${selected.size} Coordinator${selected.size > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Remove confirmation */}
      {removeTarget && (
        <div className="modal-backdrop" onClick={() => setRemoveTarget(null)}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Remove Coordinator</div>
            <div className="modal-msg">
              Remove <strong>{removeTarget}</strong> as coordinator for <strong>"{event.eventName}"</strong>?
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setRemoveTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleRemove(removeTarget)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
