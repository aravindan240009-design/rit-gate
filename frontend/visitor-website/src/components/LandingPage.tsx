import React, { useEffect, useState } from 'react';
import { theme } from '../theme';

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  { n: '01', title: 'Instant digital pass', desc: 'Register in under a minute and get a QR pass plus a manual code the moment you are approved.' },
  { n: '02', title: 'Real-time approval', desc: 'Your host is notified instantly and this page updates on its own — no refreshing, no phone calls.' },
  { n: '03', title: 'No paperwork', desc: 'Skip the register book at the gate. Your details are captured digitally and securely.' },
  { n: '04', title: 'Secure & verified', desc: 'Every pass is tied to the host who approved it and verified by security on entry and exit.' },
];

const STEPS = [
  { n: '01', title: 'Fill the form', desc: 'Enter your details, the department, and who you want to meet.' },
  { n: '02', title: 'Host approves', desc: 'Your request goes to the staff member for a quick approval.' },
  { n: '03', title: 'Get your pass', desc: 'A QR code and manual code appear here once approved.' },
  { n: '04', title: 'Scan at the gate', desc: 'Security scans your pass for entry and exit.' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { scroll-behavior: smooth; overflow-x: hidden; width: 100%; max-width: 100%; background: ${theme.color.surface}; }
    img { max-width: 100%; }
    .lp-cta { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; font-size: 15px; font-weight: 600; color: #fff; border: none; border-radius: ${theme.radius.sm}; cursor: pointer; background: ${theme.color.brandDark}; transition: background 0.18s ease, transform 0.18s ease; }
    .lp-cta:hover { background: ${theme.color.brandDeep}; transform: translateY(-1px); }
    .lp-cta:focus-visible { outline: 2px solid ${theme.color.brandDeep}; outline-offset: 2px; }
    .lp-ghost { background: none; border: none; color: ${theme.color.muted}; font-size: 14px; cursor: pointer; font-family: inherit; transition: color 0.18s ease; text-decoration: none; }
    .lp-ghost:hover { color: ${theme.color.ink}; }
    .lp-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border: 1px solid ${theme.color.line}; border-radius: ${theme.radius.pill}; font-size: 13px; font-weight: 500; color: ${theme.color.muted}; }
    .lp-dot { width: 6px; height: 6px; border-radius: 50%; background: ${theme.color.brand}; }
    .lp-card { border: 1px solid ${theme.color.line}; border-radius: ${theme.radius.lg}; padding: 26px; background: ${theme.color.surface}; transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
    .lp-card:hover { border-color: ${theme.color.brand}; box-shadow: ${theme.shadow.md}; transform: translateY(-2px); }
    .lp-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .lp-steps { display: grid; grid-template-columns: 1fr; gap: 28px; }
    .lp-eyebrow { font-size: 12px; font-weight: 600; color: ${theme.color.muted}; letter-spacing: 0.9px; text-transform: uppercase; }
    .lp-num { font-size: 13px; font-weight: 700; color: ${theme.color.brandDark}; }
    .lp-h1 { font-size: clamp(28px, 8vw, 56px); font-weight: 700; line-height: 1.12; letter-spacing: -1.5px; max-width: 720px; margin: 22px auto 0; }
    @media (min-width: 760px) {
      .lp-grid { grid-template-columns: 1fr 1fr; gap: 18px; }
      .lp-steps { grid-template-columns: repeat(4, 1fr); gap: 24px; }
    }
    @media (max-width: 480px) {
      .lp-hero { padding-top: 104px !important; padding-bottom: 56px !important; }
      .lp-h1 { letter-spacing: -0.8px; }
    }
  `;

  const wrap: React.CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '0 24px' };

  return (
    <div style={{ fontFamily: theme.font.sans, color: theme.color.ink, background: theme.color.surface, overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
      <style>{css}</style>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(10px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none', borderBottom: `1px solid ${scrolled ? theme.color.line : 'transparent'}`, transition: 'all 0.2s ease' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/logo.png" alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px' }}>RIT Gate</span>
          </div>
          <button className="lp-cta" style={{ padding: '9px 18px', fontSize: 14 }} onClick={onGetStarted}>Register visit</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero" style={{ ...wrap, paddingTop: 132, paddingBottom: 72, textAlign: 'center' }}>
        <span className="lp-pill"><span className="lp-dot" />Rajalakshmi Institute of Technology</span>
        <h1 className="lp-h1">
          Smart visitor management,<br />
          <span style={{ color: theme.color.brandDark }}>without the paperwork.</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: theme.color.body, lineHeight: 1.6, maxWidth: 500, margin: '20px auto 34px' }}>
          Register your campus visit in seconds and get an instant digital QR pass — no waiting at the gate.
        </p>
        <button className="lp-cta" onClick={onGetStarted} style={{ padding: '14px 28px', fontSize: 16 }}>
          Register your visit →
        </button>
        <div style={{ marginTop: 18, fontSize: 13, color: theme.color.muted }}>
          No app needed · Works on any phone · Free
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(28px, 6vw, 72px)', marginTop: 56, flexWrap: 'wrap' }}>
          {[['< 60s', 'Average registration'], ['100%', 'Paperless entry'], ['24/7', 'Always available']].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.6px' }}>{n}</div>
              <div style={{ fontSize: 13, color: theme.color.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Features */}
      <section style={{ ...wrap, paddingBottom: 88 }}>
        <div className="lp-eyebrow" style={{ marginBottom: 18 }}>What you get</div>
        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div key={f.n} className="lp-card">
              <div className="lp-num" style={{ marginBottom: 12 }}>{f.n}</div>
              <h3 style={{ fontSize: 17, fontWeight: 650, marginBottom: 7 }}>{f.title}</h3>
              <p style={{ fontSize: 14.5, color: theme.color.body, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: theme.color.surfaceAlt, borderTop: `1px solid ${theme.color.line}`, borderBottom: `1px solid ${theme.color.line}` }}>
        <div style={{ ...wrap, padding: '60px 24px' }}>
          <div className="lp-eyebrow" style={{ marginBottom: 30 }}>How it works</div>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="lp-num" style={{ marginBottom: 10 }}>{s.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 650, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: theme.color.body, lineHeight: 1.55 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...wrap, padding: '76px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3.4vw, 34px)', fontWeight: 700, letterSpacing: '-1px' }}>Ready to visit the campus?</h2>
        <p style={{ fontSize: 16, color: theme.color.body, margin: '12px auto 26px', maxWidth: 440 }}>Register now and get your digital gate pass in minutes.</p>
        <button className="lp-cta" onClick={onGetStarted} style={{ padding: '14px 28px', fontSize: 16 }}>Register your visit →</button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${theme.color.line}` }}>
        <div style={{ ...wrap, padding: '26px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.color.muted }}>RIT Gate</span>
          </div>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <button onClick={onGetStarted} className="lp-ghost">Register visit</button>
            <a className="lp-ghost" href="https://www.ritchennai.edu.in" target="_blank" rel="noreferrer">College website</a>
          </div>
        </div>
        <div style={{ ...wrap, padding: '0 24px 26px' }}>
          <p style={{ fontSize: 12.5, color: theme.color.muted }}>© 2026 Rajalakshmi Institute of Technology</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
