import React, { useState } from 'react';
import { login } from '../services/api';
import { ECUser } from '../types';

interface Props { onLogin: (user: ECUser) => void; }

const DEMO = [
  { username: 'eventadmin',  password: 'Event$2026',  label: 'Event Administrator' },
  { username: 'controller1', password: 'RITevents@1', label: 'Controller One' },
  { username: 'evtmgr',      password: 'Mgr#2026',    label: 'Event Manager' },
];

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) { setError('Username and password are required.'); return; }
    setLoading(true);
    try {
      const { user } = await login(username.trim(), password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      {/* ── Logo / hero ── */}
      <div style={S.hero}>
        <div style={S.logoWrap}>
          <img
            src={process.env.PUBLIC_URL + '/rit-logo.png'}
            alt="RIT logo"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
          />
        </div>
        <h1 style={S.mainTitle}>RIT GATE</h1>
        <p style={S.heroSub}>EVENT CONTROLLER PORTAL</p>
        <div style={S.pillRow}>
          {['Events', 'Coordinators', 'Passes'].map(t => (
            <span key={t} style={S.pill}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Login card ── */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>Welcome Back</h2>
        <p style={S.cardSub}>Sign in with your Event Controller credentials.</p>

        <form onSubmit={submit} noValidate>
          {/* Username */}
          <label style={S.label}>USERNAME</label>
          <input
            style={S.input}
            type="text"
            placeholder="e.g. eventadmin"
            autoComplete="username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            disabled={loading}
          />

          {/* Password */}
          <label style={{ ...S.label, marginTop: 16 }}>PASSWORD</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...S.input, paddingRight: 48 }}
              type={showPwd ? 'text' : 'password'}
              placeholder="Enter password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              disabled={loading}
            />
            <button type="button" style={S.eyeBtn}
              onClick={() => setShowPwd(v => !v)} tabIndex={-1}
              aria-label={showPwd ? 'Hide' : 'Show'}>
              {showPwd ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Error */}
          {error && <div style={S.errorBox}>{error}</div>}

          {/* Submit */}
          <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span style={S.spinner} />Signing in…
                </span>
              : 'Continue'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={S.divRow}>
          <div style={S.divLine} /><span style={S.divText}>DEMO ACCOUNTS</span><div style={S.divLine} />
        </div>
        {DEMO.map(a => (
          <button key={a.username} type="button" style={S.demoRow}
            onClick={() => { setUsername(a.username); setPassword(a.password); setError(''); }}>
            <div style={S.demoIconWrap}><span style={{ fontSize: 15, fontWeight: 700 }}>{a.label.charAt(0)}</span></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={S.demoName}>{a.label}</div>
              <div style={S.demoCred}>{a.username} · {a.password}</div>
            </div>
            <span style={S.demoArrow}>›</span>
          </button>
        ))}
      </div>

      <p style={S.footer}>© 2026 Rajalakshmi Institute of Technology</p>
    </div>
  );
}

/* ── Styles (mirrors app exactly) ───────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 20px 48px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  hero: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 32,
    marginBottom: 20,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 900,
    color: '#000000',
    letterSpacing: 2,
    margin: 0,
  },
  heroSub: {
    fontSize: 11,
    color: '#000000',
    letterSpacing: 1.5,
    marginTop: 6,
    marginBottom: 14,
    fontWeight: 700,
  },
  pillRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#000000',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#000000',
    margin: '0 0 4px',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    margin: '0 0 22px',
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    display: 'block',
    width: '100%',
    height: 56,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: '0 16px',
    fontSize: 16,
    color: '#000000',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    padding: '2px 4px',
    lineHeight: 1,
    color: '#94A3B8',
  },
  errorBox: {
    marginTop: 14,
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13.5,
    color: '#B91C1C',
    fontWeight: 500,
  },
  btn: {
    display: 'block',
    width: '100%',
    height: 58,
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 16,
    fontSize: 17,
    fontWeight: 700,
    marginTop: 20,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    transition: 'opacity 0.15s',
  },
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  divRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    margin: '28px 0 16px',
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  divText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#000000',
    letterSpacing: 1,
    whiteSpace: 'nowrap' as const,
  },
  demoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '13px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    cursor: 'pointer',
    marginBottom: 10,
    transition: 'background 0.15s',
  },
  demoIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  demoName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#000000',
  },
  demoCred: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  demoArrow: {
    fontSize: 22,
    color: '#CBD5E1',
    flexShrink: 0,
  },
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center' as const,
  },
};
