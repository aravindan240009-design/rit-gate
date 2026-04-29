import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { overflow-x: hidden; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
    @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,188,212,0.4); } 70% { box-shadow: 0 0 0 20px rgba(0,188,212,0); } 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0); } }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,188,212,0.12); border: 1px solid rgba(0,188,212,0.3); color: #00838F; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; padding: 6px 16px; border-radius: 50px; animation: fadeUp 0.6s ease both; }
    .hero-title { font-size: clamp(36px, 6vw, 64px); font-weight: 900; line-height: 1.1; letter-spacing: -2px; color: #0f172a; animation: fadeUp 0.7s 0.1s ease both; }
    .hero-title span { background: linear-gradient(135deg, #00BCD4 0%, #0097A7 50%, #006064 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-sub { font-size: clamp(16px, 2vw, 20px); color: #475569; line-height: 1.7; max-width: 600px; margin: 0 auto; animation: fadeUp 0.7s 0.2s ease both; }
    .cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 40px; font-size: 17px; font-weight: 700; color: #fff; border: none; border-radius: 50px; cursor: pointer; background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); box-shadow: 0 8px 32px rgba(0,188,212,0.35); transition: all 0.25s ease; animation: fadeUp 0.7s 0.3s ease both, pulse-ring 2.5s 1s ease infinite; }
    .cta-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 48px rgba(0,188,212,0.45); }
    .stat-num { font-size: 36px; font-weight: 800; background: linear-gradient(135deg, #00BCD4, #0097A7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .feature-card { background: #fff; border-radius: 20px; padding: 36px 28px; text-align: center; transition: all 0.3s ease; border: 2px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .feature-card:hover { transform: translateY(-8px); border-color: #00BCD4; box-shadow: 0 16px 48px rgba(0,188,212,0.15); }
    .step-num { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #00BCD4, #0097A7); color: #fff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .info-card { background: #fff; border-radius: 16px; padding: 28px 20px; text-align: center; transition: all 0.3s ease; border: 2px solid #e2e8f0; }
    .info-card:hover { border-color: #00BCD4; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,188,212,0.12); }
    .nav-link { color: #475569; font-size: 15px; font-weight: 500; text-decoration: none; transition: color 0.2s; }
    .nav-link:hover { color: #00BCD4; }
    @media (max-width: 640px) { .hero-stats { flex-direction: column !important; gap: 24px !important; } .stat-divider { display: none !important; } }
  `;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden', background: '#f8fafc' }}>
      <style>{css}</style>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none', transition: 'all 0.3s ease', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="RIT Gate" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>RIT Gate</span>
        </div>
        <div style={{ display: 'flex', gap: 32 }} />
        <button className="cta-btn" style={{ padding: '10px 24px', fontSize: 14, animation: 'none' }} onClick={onGetStarted}>Register Visit</button>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0fdff 0%, #e0f7fa 40%, #f8fafc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,150,136,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, width: '100%', position: 'relative' }}>
          <div className="hero-badge"><span>&#127963;&#65039;</span> Rajalakshmi Institute of Technology</div>
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <img src="/logo.png" alt="RIT Gate" style={{ width: 100, height: 100, objectFit: 'contain', animation: 'float 4s ease-in-out infinite', filter: 'drop-shadow(0 8px 24px rgba(0,188,212,0.25))' }} />
          </div>
          <h1 className="hero-title" style={{ marginBottom: 20 }}>Smart Visitor<br /><span>Management System</span></h1>
          <p className="hero-sub" style={{ marginBottom: 40 }}>Register your campus visit in seconds. Get instant digital approval and a QR pass — no paperwork, no waiting.</p>
          <button className="cta-btn" onClick={onGetStarted}>
            <span style={{ fontSize: 20 }}>&#9998;</span>
            Register Your Visit
            <span style={{ fontSize: 20 }}>&#8594;</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', background: '#0f172a', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <img src="/logo.png" alt="RIT Gate" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.7)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600 }}>RIT Gate</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>&#169; 2026 Rajalakshmi Institute of Technology. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
