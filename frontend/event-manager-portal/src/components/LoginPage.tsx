import React, { useState } from 'react';
import { theme } from '../theme';
import { login } from '../services/api';
import { ECUser } from '../types';

interface Props {
  onLogin: (user: ECUser) => void;
}

const DEMO_ACCOUNTS = [
  { username: 'eventadmin', password: 'Event$2026', label: 'Event Administrator' },
  { username: 'controller1', password: 'RITevents@1', label: 'Controller One' },
  { username: 'evtmgr', password: 'Mgr#2026', label: 'Event Manager' },
];

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await login(username.trim(), password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: #f1f5f9; }

    .login-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: linear-gradient(160deg, #e8edf5 0%, #f1f5f9 60%, #e2e8f0 100%);
      font-family: ${theme.font.sans};
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: ${theme.radius.xl};
      box-shadow: ${theme.shadow.lg};
      overflow: hidden;
    }

    .login-header {
      background: ${theme.color.brand};
      padding: 32px 32px 28px;
      text-align: center;
    }

    .login-logo-wrap {
      width: 56px;
      height: 56px;
      background: rgba(255,255,255,0.12);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .login-logo-icon {
      font-size: 26px;
    }

    .login-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.4px;
      margin-bottom: 4px;
    }

    .login-subtitle {
      font-size: 13px;
      color: rgba(255,255,255,0.65);
      font-weight: 500;
    }

    .login-body {
      padding: 32px;
    }

    .login-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: ${theme.color.ink};
      margin-bottom: 6px;
    }

    .login-input-wrap {
      position: relative;
      margin-bottom: 16px;
    }

    .login-input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid ${theme.color.line};
      border-radius: ${theme.radius.md};
      font-size: 15px;
      color: ${theme.color.ink};
      background: ${theme.color.surfaceAlt};
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
    }

    .login-input:focus {
      border-color: ${theme.color.brandLight};
      box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
      background: #fff;
    }

    .login-input.has-toggle {
      padding-right: 44px;
    }

    .login-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: ${theme.color.muted};
      font-size: 18px;
      padding: 2px 4px;
      line-height: 1;
    }

    .login-error {
      background: ${theme.color.dangerSoft};
      border: 1px solid #fca5a5;
      border-radius: ${theme.radius.md};
      padding: 10px 14px;
      font-size: 13.5px;
      color: #b91c1c;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      background: ${theme.color.brand};
      color: #fff;
      border: none;
      border-radius: ${theme.radius.md};
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, transform 0.14s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .login-btn:hover:not(:disabled) {
      background: ${theme.color.brandMid};
      transform: translateY(-1px);
    }

    .login-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .login-spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .demo-section {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid ${theme.color.line};
    }

    .demo-title {
      font-size: 12px;
      font-weight: 700;
      color: ${theme.color.muted};
      letter-spacing: 0.7px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .demo-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .demo-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: ${theme.color.surfaceSunken};
      border: 1px solid ${theme.color.line};
      border-radius: ${theme.radius.md};
      cursor: pointer;
      transition: border-color 0.16s, background 0.16s;
      text-align: left;
    }

    .demo-btn:hover {
      border-color: ${theme.color.brandLight};
      background: ${theme.color.brandSoft};
    }

    .demo-btn-name {
      font-size: 13px;
      font-weight: 600;
      color: ${theme.color.ink};
    }

    .demo-btn-cred {
      font-size: 12px;
      color: ${theme.color.muted};
      margin-top: 1px;
    }

    .demo-btn-use {
      font-size: 11.5px;
      font-weight: 600;
      color: ${theme.color.brandLight};
      white-space: nowrap;
      margin-left: 10px;
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: ${theme.color.muted};
    }
  `;

  return (
    <div className="login-root">
      <style>{css}</style>

      <div className="login-card fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <span className="login-logo-icon">🎫</span>
          </div>
          <div className="login-title">Event Controller</div>
          <div className="login-subtitle">RIT Gate · Event Management Portal</div>
        </div>

        {/* Body */}
        <div className="login-body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <label className="login-label" htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <input
                id="username"
                className="login-input"
                type="text"
                autoComplete="username"
                placeholder="e.g. eventadmin"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <input
                id="password"
                className="login-input has-toggle"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>

            {/* Error */}
            {error && <div className="login-error" role="alert">{error}</div>}

            {/* Submit */}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? <><div className="login-spinner" />Signing in…</> : 'Sign in →'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="demo-section">
            <div className="demo-title">Demo accounts</div>
            <div className="demo-list">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.username}
                  className="demo-btn"
                  type="button"
                  onClick={() => fillDemo(a.username, a.password)}
                >
                  <div>
                    <div className="demo-btn-name">{a.label}</div>
                    <div className="demo-btn-cred">{a.username} / {a.password}</div>
                  </div>
                  <span className="demo-btn-use">Use →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="login-footer" style={{ marginTop: 20 }}>
        © 2026 Rajalakshmi Institute of Technology
      </div>
    </div>
  );
}
