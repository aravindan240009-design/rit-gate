import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [hoveredCard, setHoveredCard] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const css = `
    *, *::before,  padding: 0; }
    body { overflow-x: hidden; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-12px); }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(0,188,212,0.4); }
      70%  { box-shadow: 0 0 0 20px rgba(0,188,212,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,188,212,0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(0,188,212,0.12); border: 1px solid rgba(0,188,212,0.3);
      color: #00BCD4; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;
      padding: 6px 16px; border-radius: 50px;
      animation: fadeUp 0.6s ease both;
    }
    .hero-title {
      font-size: clamp(36px, 6vw, 64px);
      font-weight: 900; line-height: 1.1; letter-spacing: -2px;
      color: #0f172a;
      animation: fadeUp 0.7s 0.1s ease both;
    }
    .hero-title span {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 50%, #006064 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: clamp(16px, 2vw, 20px); ;
      max-width: 600px; margin: 0 auto;
      animation: fadeUp 0.7s 0.2s ease both;
    }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 40px; font-size: 17px; font-weight: 700;
      color: #fff; border: none; border-radius: 50px; cursor: pointer;
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      box-shadow: 0 8px 32px rgba(0,188,212,0.35);
      transition: all 0.25s ease;
      animation: fadeUp 0.7s 0.3s ease boease infinite;
    }
    .cta-btn:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 16px 48px rgba(0,188,212,0.45);
    }
    .stat-num {
      font-size: 36px; font-weight: 800; color: #00BCD4;
      background: linear-gradient(135deg, #00BCD4, #0097A7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .feature-card {
      background: #fff; border-radius: 20px; padding: 36px 28px;
      text-align: center; transition: all 0.3s ease;
      border: 2px solid #e2e8f0;
      brgba(0,0,0,0.06);
    }
    .feature-card:hover {
      transform: translateY(-8px);
      border-color: #00BCD4;
      box-shadow: 0 16px 48px rgba(0,188,212,0.15);
    }
    .step-num {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #00BCD4, #0097A7);
      color: #fff; font-size: 18px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .info-card {
      background: #fff; border-radius: 16px; padding: 28px 20px;
      ll 0.3s ease;
      border: 2px solid #e2e8f0;
    }
    .info-card:hover {
      border-color: #00BCD4;
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,188,212,0.12);
    }
    .nav-link {
      color: #475569; font-size: 15px; font-weight: 500;
      text-decoration: none; transition: color 0.2s;
    }
    .nav-link:hover { color: #00BCD4; }
    @media (max-width: 640px) {
      .hero-stats { flex-direction: column !important; gap: 24px !important; }
      e !important; }
    }
  `;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden', background: '#f8fafc' }}>
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: s.06)' : 'none',
        transition: 'all 0.3s ease',
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', jt: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="RIT Gate" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>RIT Gate</span>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#features" className="nav-link">Features</a>
        </div>
        <button className="con: 'none' }} onClick={onGetStarted}>
          Register Visit
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0fdff 0%, #e0f7fa 40%, #f8fafc 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ p0, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,150,136,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, width: '100%', position: 'relative' }}>
          <div className="hero-badge">
            <span>🏛️</span> Rajalakshmi Institute of Technology
          </div>

          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <img src="/logo.png" alt="RIT Gate" style={{ width: 100, height: 100, objectFit: 'contain', animation: 'float 4s ease-in-out infinite', filter: 'drop-shadow(0 8px 24px rgba(0,188,212,0.25))' }} />
          </div>

          <h1 className="hero-title" style={{ marginBottom: 20 }}>
            Smart Visitor<br /><span>Management System</span>
          </h1>

          <p className="hero-sub" style={{ marginBottom: 40 }}>
            Register your campus visit in seconds. Get instant digital approval and a QR pass — no paperwork, no waiting.
          </p>

          <button className="cta-btn" onClick={onGetStarted}>
            <span style={{ fontSize: 20 }}>✎</span>
            Register Your Visit
            <span style={{ fontSize: 20 }}>→</span>
          </button>

          {/* Stats */}
          <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, marginTop: 64, flexWrap: 'wrap', animation: 'fadeIn 1s 0.5s ease both' }}>
            {[
              { num: '5000+', label: 'Visitors Registered' },
              { num: '< 2 min', label: 'Avg Registration Time' },
              { num: '24/7'ility' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="stat-divider" style={{ width: 1, height: 48, background: '#cbd5e1' }} />}
                <div style={{ textAlign: 'center' }}>
                  <div className="stat-num">{s.num}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,188,212,0.08)', color: '#0097A7', fontSize: 13, fontWeight: 700, letterSpacing: 1, padding: '6px 16px', borderRadius: 50, marginBottom: 16 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#0f172a', letterSpacing: -1 }}>Three simple steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
            {[
              { icon: '📝', title: 'Fill the Form', desc: 'Provide your basic details and purpose of visit in our simple, guided form.' },
              { . Get notified the moment it\'s approved.' },
              { icon: '📱', title: 'Show & Enter', desc: 'Present your QR code at the gate for quick, contactless, secure entry.' },
            ].map((f, i) => (
              <div key={f.title} className="feature-card"
                onMouseEnter={() => setHoveredCard(`step${i}`)}
                onMouseLeave={() => setHoveredCard('')}
              >
                <div className="step-num">{i + 1}</div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <ection id="features" style={{ padding: '80px 24px', background: 'linear-gradient(160deg, #f0fdff 0%, #e0f7fa 60%, #f8fafc 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,188,212,0.08)', color: '#0097A7', fontSize: 13, fontWeight: 700, letterSpacing: 1, padding: '6px 16px', borderRadius: 50, marginBottom: 16 }}>FEATURES</div>
            ze: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#0f172a', letterSpacing: -1 }}>Why choose RIT Gate?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', title: 'Secure & Private', desc: 'Your information is encrypted and stored securely on our servers.' },
              { icon: '⏱️', title: 'Quick Process', desc: 'Complete your registration in under 2 minutes from any device.' },
              { icon: '📲', title: 'Digital QR Pass', desc: 'Receive a unique QR code for contactless, paperless gate entry.' },
              { icon: '🔔', title: 'Real-time Updates', desc: 'Get instant notifications when your visit request is approved or rejected.' },
              { icon: '🌐', title: 'Works Everywhere', desc: 'Access from any browser — mobile, tablet, or desktop.' },
    
            ].map((f) => (
              <div key={f.title} className="info-card">
                <div style={{ fontSize: 40, marginBottom: 14 }}>{f.icon}</div>
                <h4 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
      adding: '80px 24px',
        background: 'linear-gradient(135deg, #006064 0%, #00838F 50%, #00BCD4 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: -1 }}>
            Ready to visit our campus?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 36, lineHeight: 1.6 }}>
            Red get your digital pass in minutes.
          </p>
          <button
            className="cta-btn"
            style={{ background: '#fff', color: '#0097A7', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', animation: 'none' }}
            onClick={onGetStarted}
            onMouseEnter={() => setHoveredCard('cta2')}
            onMouseLeave={() => setHoveredCard('')}
          >
            <span style={{ fontSize: 20 }}>✎</span>
            Register Your Visit
            <span style={{ fontSize: 20 }}>→</span>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '32px 24px', background: '#0f172a', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <img src="/logo.png" alt="RIT Gate" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.7)' }} />
          <span style={ntWeight: 600 }}>RIT Gate</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          © 2026 Rajalakshmi Institute of Technology. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
