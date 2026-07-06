import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../theme';
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE:    { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  COMPLETED: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
};

export default function EventListPage({ user, onManageCoordinators, onViewPasses, onLogout }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // create form
  const [cName, setCName] = useState('');
  const [cDate, setCDate] = useState('');
  const [cVenue, setCVenue] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState('');

  // delete
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // toast
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchAllEvents();
      setEvents(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCError('');
    if (!cName.trim()) { setCError('Event name is required.'); return; }
    if (!cDate) { setCError('Event date is required.'); return; }
    if (!cVenue.trim()) { setCError('Venue is required.'); return; }
    if (cDate < todayISO()) { setCError('Event date must be today or in the future.'); return; }
    setCLoading(true);
    try {
      await createEvent(user.username, cName.trim(), cDate, cVenue.trim());
      setCName(''); setCDate(''); setCVenue('');
      setShowCreate(false);
      await load();
      showToast('✅ Event created successfully');
    } catch (err: any) {
      setCError(err.message || 'Failed to create event');
    } finally {
      setCLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteEvent(deleteTarget.id, user.username);
      setDeleteTarget(null);
      await load();
      showToast('🗑️ Event deleted');
    } catch (err: any) {
      setDeleteTarget(null);
      showToast('❌ ' + (err.message || 'Failed to delete event'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const css = `
    .portal-root {
      min-height: 100vh;
      background: #f1f5f9;
      font-family: ${theme.font.sans};
    }

    /* ── Topbar ── */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: ${theme.color.brand};
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 60px;
      box-shadow: 0 2px 8px rgba(15,23,42,0.18);
    }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .topbar-icon { font-size: 22px; }
    .topbar-title { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.2px; }
    .topbar-sub { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 1px; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .topbar-user { font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 500; }
    .logout-btn {
      padding: 7px 14px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: ${theme.radius.pill};
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .logout-btn:hover { background: rgba(255,255,255,0.22); }

    /* ── Main ── */
    .main { max-width: 900px; margin: 0 auto; padding: 28px 20px 60px; }

    /* ── Section header ── */
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .section-title { font-size: 20px; font-weight: 800; color: ${theme.color.ink}; letter-spacing: -0.3px; }
    .section-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 22px;
      padding: 0 8px;
      background: ${theme.color.brandSoft};
      color: ${theme.color.brandLight};
      border-radius: ${theme.radius.pill};
      font-size: 12px;
      font-weight: 700;
      margin-left: 8px;
    }

    /* ── Create button ── */
    .create-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      background: ${theme.color.brand};
      color: #fff;
      border: none;
      border-radius: ${theme.radius.md};
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, transform 0.14s;
      box-shadow: ${theme.shadow.sm};
    }
    .create-btn:hover { background: ${theme.color.brandMid}; transform: translateY(-1px); }

    /* ── Create form card ── */
    .create-card {
      background: #fff;
      border: 1.5px solid ${theme.color.brandLight};
      border-radius: ${theme.radius.lg};
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: ${theme.shadow.md};
    }
    .create-card-title { font-size: 16px; font-weight: 700; color: ${theme.color.ink}; margin-bottom: 18px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }
    .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .form-label { font-size: 12.5px; font-weight: 600; color: ${theme.color.body}; }
    .form-input {
      padding: 10px 12px;
      border: 1.5px solid ${theme.color.line};
      border-radius: ${theme.radius.sm};
      font-size: 14px;
      color: ${theme.color.ink};
      background: ${theme.color.surfaceAlt};
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-input:focus { border-color: ${theme.color.brandLight}; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); background: #fff; }
    .form-error { background: ${theme.color.dangerSoft}; border: 1px solid #fca5a5; border-radius: ${theme.radius.sm}; padding: 8px 12px; font-size: 13px; color: #b91c1c; font-weight: 500; margin-bottom: 12px; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
    .btn-primary {
      padding: 10px 22px; background: ${theme.color.brand}; color: #fff; border: none;
      border-radius: ${theme.radius.md}; font-size: 14px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 7px;
      transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: ${theme.color.brandMid}; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost {
      padding: 10px 18px; background: transparent; color: ${theme.color.body};
      border: 1.5px solid ${theme.color.line}; border-radius: ${theme.radius.md};
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }
    .btn-ghost:hover { border-color: ${theme.color.brandLight}; color: ${theme.color.ink}; }

    /* ── Event cards ── */
    .events-grid { display: flex; flex-direction: column; gap: 14px; }
    .event-card {
      background: #fff;
      border: 1px solid ${theme.color.line};
      border-radius: ${theme.radius.lg};
      padding: 20px 22px;
      box-shadow: ${theme.shadow.sm};
      transition: box-shadow 0.18s, transform 0.18s;
    }
    .event-card:hover { box-shadow: ${theme.shadow.md}; transform: translateY(-1px); }

    .event-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .event-name { font-size: 17px; font-weight: 800; color: ${theme.color.ink}; margin-bottom: 4px; letter-spacing: -0.2px; }
    .event-meta { font-size: 13px; color: ${theme.color.body}; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .event-dot { color: ${theme.color.muted}; }
    .event-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: ${theme.radius.pill};
      font-size: 11px;
      font-weight: 700;
      border: 1px solid;
      white-space: nowrap;
    }

    .event-footer { display: flex; align-items: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      border-radius: ${theme.radius.sm};
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: 1.5px solid;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .action-btn-coord {
      background: ${theme.color.brandSoft}; color: ${theme.color.brandLight};
      border-color: #bfdbfe;
    }
    .action-btn-coord:hover { background: #dbeafe; border-color: ${theme.color.brandLight}; }
    .action-btn-passes {
      background: ${theme.color.successSoft}; color: ${theme.color.success};
      border-color: #86efac;
    }
    .action-btn-passes:hover { background: #bbf7d0; }
    .action-btn-delete {
      background: ${theme.color.dangerSoft}; color: ${theme.color.danger};
      border-color: #fca5a5; margin-left: auto;
    }
    .action-btn-delete:hover { background: #fecaca; }

    /* ── Empty ── */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: ${theme.color.muted};
    }
    .empty-icon { font-size: 52px; margin-bottom: 14px; }
    .empty-title { font-size: 17px; font-weight: 700; color: ${theme.color.body}; margin-bottom: 6px; }
    .empty-sub { font-size: 14px; }

    /* ── Loader ── */
    .loader-wrap { display: flex; align-items: center; justify-content: center; padding: 80px 0; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid ${theme.color.line};
      border-top-color: ${theme.color.brandLight};
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Error banner ── */
    .error-banner {
      background: ${theme.color.dangerSoft}; border: 1px solid #fca5a5;
      border-radius: ${theme.radius.md}; padding: 14px 18px;
      font-size: 14px; color: #b91c1c; font-weight: 500;
      display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
    }

    /* ── Delete modal ── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: 20px;
    }
    .modal-card {
      background: #fff; border-radius: ${theme.radius.xl};
      padding: 28px; max-width: 400px; width: 100%;
      box-shadow: ${theme.shadow.lg};
    }
    .modal-title { font-size: 18px; font-weight: 800; color: ${theme.color.ink}; margin-bottom: 10px; }
    .modal-msg { font-size: 14px; color: ${theme.color.body}; line-height: 1.6; margin-bottom: 22px; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-danger {
      padding: 10px 22px; background: ${theme.color.danger}; color: #fff;
      border: none; border-radius: ${theme.radius.md};
      font-size: 14px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 7px;
      transition: background 0.15s;
    }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Toast ── */
    .toast {
      position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
      background: ${theme.color.ink}; color: #fff;
      padding: 12px 24px; border-radius: ${theme.radius.pill};
      font-size: 14px; font-weight: 600;
      box-shadow: ${theme.shadow.lg};
      z-index: 999;
      animation: slideUp 0.22s ease both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;

  return (
    <div className="portal-root">
      <style>{css}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-icon">🎫</span>
          <div>
            <div className="topbar-title">Event Controller</div>
            <div className="topbar-sub">RIT Gate · Event Management Portal</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">👤 {user.displayName}</span>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div className="main">

        {/* Section header */}
        <div className="section-head">
          <div>
            <span className="section-title">
              All Events
              {!loading && <span className="section-count">{events.length}</span>}
            </span>
          </div>
          <button className="create-btn" onClick={() => { setShowCreate(v => !v); setCError(''); }}>
            {showCreate ? '✕ Cancel' : '+ New Event'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="create-card fade-in">
            <div className="create-card-title">Create New Event</div>
            <form onSubmit={handleCreate} noValidate>
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input className="form-input" placeholder="e.g. National Level Symposium 2026"
                  value={cName} onChange={e => setCName(e.target.value)} disabled={cLoading} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                  <input className="form-input" type="date" min={todayISO()}
                    value={cDate} onChange={e => setCDate(e.target.value)} disabled={cLoading} />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input className="form-input" placeholder="e.g. Seminar Hall, Block A"
                    value={cVenue} onChange={e => setCVenue(e.target.value)} disabled={cLoading} />
                </div>
              </div>
              {cError && <div className="form-error">{cError}</div>}
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => { setShowCreate(false); setCError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={cLoading}>
                  {cLoading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Creating…</> : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button className="btn-ghost" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}
              onClick={load}>Retry</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="loader-wrap"><div className="spinner" /></div>
        ) : events.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">No events yet</div>
            <div className="empty-sub">Create your first event using the button above.</div>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(ev => {
              const sc = STATUS_COLOR[ev.status] ?? STATUS_COLOR.ACTIVE;
              return (
                <div key={ev.id} className="event-card fade-in">
                  <div className="event-top">
                    <div>
                      <div className="event-name">{ev.eventName}</div>
                      <div className="event-meta">
                        <span>📅 {fmtDate(ev.eventDate)}</span>
                        <span className="event-dot">·</span>
                        <span>📍 {ev.venue || 'No venue'}</span>
                        <span className="event-dot">·</span>
                        <span>👤 {ev.createdByHod}</span>
                      </div>
                    </div>
                    <span className="event-badge"
                      style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                      {ev.status}
                    </span>
                  </div>
                  <div className="event-footer">
                    <button className="action-btn action-btn-coord"
                      onClick={() => onManageCoordinators(ev)}>
                      👥 Coordinators
                    </button>
                    <button className="action-btn action-btn-passes"
                      onClick={() => onViewPasses(ev)}>
                      🎟️ Passes
                    </button>
                    <button className="action-btn action-btn-delete"
                      onClick={() => setDeleteTarget(ev)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Event</div>
            <div className="modal-msg">
              Are you sure you want to delete <strong>"{deleteTarget.eventName}"</strong>?
              All coordinators will be notified and all issued passes will be removed.
              This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Deleting…</>
                  : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
