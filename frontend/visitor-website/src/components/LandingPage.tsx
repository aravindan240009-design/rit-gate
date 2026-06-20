import React, { useEffect, useState } from 'react';
import { theme } from '../theme';

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant Digital Pass',
    desc: 'Register in under a minute and receive a QR gate pass plus a manual code the moment you are approved.',
  },
  {
    icon: '🔔',
    title: 'Real-time Approval',
    desc: 'Your host is notified instantly. This page updates on its own — no refreshing, no phone calls.',
  },
  {
    icon: '📄',
    title: 'Zero Paperwork',
    desc: 'Skip the register book at the gate. Everything is captured digitally and securely on your device.',
  },
  {
    icon: '🛡️',
    title: 'Secure & Verified',
    desc: 'Every pass is tied to the host who approved it and verified by security on entry and exit.',
  },
];

const STEPS = [
  { num: 1, title: 'Fill the form', desc: 'Enter your details, the department, and the person you want to meet.' },
  { num: 2, title: 'Host approves', desc: 'Your request is sent to the staff member for a quick approval.' },
  { num: 3, title: 'Get your QR pass', desc: 'A QR code and manual code appear here once approved.' },
  { num: 4, title: 'Scan at the gate', desc: 'Security scans your pass for a smooth entry and exit.' },
];

const STATS = [
  { num: '<60s', label: 'Average registration' },
  { num: '100%', label: 'Paperless entry' },
  { num: '24/7', label: 'Always available' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { overflow-x: hidden; }
    @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes lp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
    @keyframes lp-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,188,212,0.4); } 70% { box-shadow: 0 0 0 18px rgba(0,188,212,0); } 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0); } }
    @keyframes lp-blob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-20px) scale(1.08); } }
    .lp-reveal { animation: lp-fadeUp 0.7s ease both; }
    .lp-cta { display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; font-size: 17px; font-weight: 700; color: #fff; border: none; border-radius: ${theme.radius.pill}; cursor: pointer; background: ${theme.gradient.brand}; box-shadow: ${theme.shadow.brand}; transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .lp-cta:hover { transform: translateY(-3px); box-shadow: 0 18px 50px rgba(0,188,212,0.45); }
    .lp-cta:focus-visible { outline: 3px solid ${theme.color.brandDeep}; outline-offset: 3px; }
    .lp-pulse { animation: lp-pulse-ring 2.6s 1.2s ease infinite; }
    .lp-feature { background: ${theme.color.surface}; border-radius: ${theme.radius.lg}; padding: 32px 26px; border: 1px solid ${theme.color.line}; box-shadow: ${theme.shadow.sm}; transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease; }
    .lp-feature:hover { transform: translateY(-8px); border-color: ${theme.color.brand}; box-shadow: ${theme.shadow.brandSoft}; }
    .lp-step { background: ${theme.color.surface}; border-radius: ${theme.radius.lg}; padding: 28px 24px; border: 1px solid ${theme.color.line}; box-shadow: ${theme.shadow.sm}; transition: transform 0.28s ease, box-shadow 0.28s ease; }
    .lp-step:hover { transform: translateY(-6px); box-shadow: ${theme.shadow.brandSoft}; }
    .lp-grad-text { background: ${theme.gradient.brandDeep}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .lp-link { color: rgba(255,255,255,0.7); font-size: 14px; text-decoration: none; transition: color 0.2s; }
    .lp-link:hover { color: #fff; }
    @media (max-width: 720px) {
      .lp-nav { padding: 14px 20px !important; }
      .lp-section { padding-left: 20px !important; padding-right: 20px !important; }
    }
  `;

  const section: React.CSSProperties = {
    maxWidth: theme.maxWidth,
    margin: '0 auto',
    padding: '0 24px',
  };

  return (
    <div style={{ fontFamily: theme.font.sans, color: theme.color.ink, background: theme.color.surfaceAlt }}>
      <style>{css}</style>

      {/* Navbar */}
      <nav
        className="lp-nav"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled ? `1px solid ${theme.color.line}` : '1px solid transparent',
          transition: 'all 0.3s ease',
          padding: '18px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontSize: 18, fontWeight: 800 }}>RIT Gate</span>
        </div>
        <button className="lp-cta" style={{ padding: '10px 22px', fontSize: 14 }} onClick={onGetStarted}>
          Register Visit
        </button>
      </nav>

      {/* Hero */}
      <header
        className="lp-section"
        style={{
          position: 'relative', overflow: 'hidden',
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme.gradient.heroWash, padding: '120px 24px 80px', textAlign: 'center',
        }}
      >
        <div style={{ position: 'absolute', top: '8%', left: '4%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,188,212,0.10) 0%, transparent 70%)', animation: 'lp-blob 12s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '6%', right: '4%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,150,136,0.10) 0%, transparent 70%)', animation: 'lp-blob 14s ease-in-out infinite reverse', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 820, width: '100%', position: 'relative' }}>
          <div className="lp-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.brandTint, border: `1px solid rgba(0,188,212,0.3)`, color: theme.color.brandDark, fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', padding: '7px 16px', borderRadius: theme.radius.pill }}>
            🏛️ Rajalakshmi Institute of Technology
          </div>

          <div className="lp-reveal" style={{ margin: '26px 0' }}>
            <img src="/logo.png" alt="RIT Gate" style={{ width: 96, height: 96, objectFit: 'contain', animation: 'lp-float 4s ease-in-out infinite', filter: 'drop-shadow(0 10px 28px rgba(0,188,212,0.28))' }} />
          </div>

          <h1 className="lp-reveal" style={{ fontSize: 'clamp(36px, 6vw, 66px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px' }}>
            Smart Visitor<br /><span className="lp-grad-text">Management System</span>
          </h1>

          <p className="lp-reveal" style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: theme.color.body, lineHeight: 1.7, maxWidth: 620, margin: '22px auto 36px' }}>
            Register your campus visit in seconds. Get instant digital approval and a QR pass —
            no paperwork, no waiting at the gate.
          </p>

          <button className="lp-cta lp-pulse" onClick={onGetStarted}>
            <span style={{ fontSize: 20 }}>✎</span> Register Your Visit <span style={{ fontSize: 20 }}>→</span>
          </button>

          {/* Quick stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(20px, 5vw, 56px)', marginTop: 56 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div className="lp-grad-text" style={{ fontSize: 34, fontWeight: 800 }}>{s.num}</div>
                <div style={{ fontSize: 13, color: theme.color.muted, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="lp-section" style={{ ...section, padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', color: theme.color.brandDark, textTransform: 'uppercase' }}>Why RIT Gate</div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, marginTop: 10, letterSpacing: '-1px' }}>Everything a campus visit needs</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature">
              <div style={{ width: 54, height: 54, borderRadius: theme.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, background: theme.color.brandTint, marginBottom: 18 }}>{f.icon}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 15, color: theme.color.body, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: theme.color.surfaceSunken, padding: '88px 0' }}>
        <div className="lp-section" style={section}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', color: theme.color.brandDark, textTransform: 'uppercase' }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, marginTop: 10, letterSpacing: '-1px' }}>Four simple steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22 }}>
            {STEPS.map((s) => (
              <div key={s.num} className="lp-step">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.gradient.brand, color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: theme.shadow.brandSoft }}>{s.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: theme.color.body, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="lp-section" style={{ padding: '88px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', borderRadius: theme.radius.xl, background: theme.gradient.brandDeep, padding: 'clamp(40px, 6vw, 64px) 32px', textAlign: 'center', boxShadow: theme.shadow.lg, position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px' }}>Ready to visit the campus?</h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 17, margin: '14px auto 32px', maxWidth: 520, lineHeight: 1.6 }}>
            Register now and get your digital gate pass in minutes.
          </p>
          <button
            onClick={onGetStarted}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 38px', fontSize: 17, fontWeight: 700, color: theme.color.brandDark, background: '#fff', border: 'none', borderRadius: theme.radius.pill, cursor: 'pointer', boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}
          >
            Register Your Visit →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: theme.color.ink, padding: '48px 24px 32px' }}>
        <div style={{ ...section, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>RIT Gate</span>
          </div>
          <div style={{ display: 'flex', gap: 26 }}>
            <button onClick={onGetStarted} className="lp-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Register Visit</button>
            <a className="lp-link" href="https://www.ritchennai.edu.in" target="_blank" rel="noreferrer">College Website</a>
          </div>
        </div>
        <div style={{ ...section, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 28, paddingTop: 20, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            © 2026 Rajalakshmi Institute of Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
