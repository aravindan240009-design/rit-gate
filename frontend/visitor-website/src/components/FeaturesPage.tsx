import React, { useState } from 'react';

interface FeaturesPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack, onGetStarted }) => {
  const [hoveredBack, setHoveredBack] = useState(false);
  const [hoveredCard, setHoveredCard] = useState('');

  const features = [
    { icon: '🔒', title: 'Secure & Private', desc: 'Your information is encrypted and stored securely on our servers. We never share your data with third parties.' },
    { icon: '⏱️', title: 'Quick Process', desc: 'Complete your registration in under 2 minutes from any device — no app download required.' },
    { icon: '📱', title: 'Digital QR Pass', desc: 'Receive a unique QR code for contactless, paperless gate entry. Works on any smartphone screen.' },
    { icon: '🔔', title: 'Real-time Updates', desc: 'Get instant notifications when your visit request is approved or rejected by the faculty.' },
    { icon: '🌐', title: 'Works Everywhere', desc: 'Access from any browser — mobile, tablet, or desktop. No installation needed.' },
    { icon: '📞', title: '24/7 Support', desc: 'Security personnel are always available to assist you at the gate, round the clock.' },
    { icon: '🏢', title: 'Department-wise Routing', desc: 'Your request is automatically routed to the correct department and staff member for approval.' },
    { icon: '🚗', title: 'Vehicle Registration', desc: 'Register your vehicle details along with your visit for seamless vehicle entry tracking.' },
    { icon: '👥', title: 'Group Visits', desc: 'Register multiple visitors in a single request — perfect for delegations and group visits.' },
  ];

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { overflow-x: hidden; }
    .feat-card { background: #fff; border-radius: 20px; padding: 32px 24px; text-align: center; transition: all 0.3s ease; border: 2px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .feat-card:hover { transform: translateY(-8px); border-color: #00BCD4; box-shadow: 0 16px 48px rgba(0,188,212,0.15); }
    .back-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; font-size: 15px; font-weight: 600; color: #0097A7; background: #fff; border: 2px solid #00BCD4; border-radius: 50px; cursor: pointer; transition: all 0.25s ease; text-decoration: none; }
    .back-btn:hover { background: #00BCD4; color: #fff; transform: translateX(-4px); }
    .cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 40px; font-size: 17px; font-weight: 700; color: #fff; border: none; border-radius: 50px; cursor: pointer; background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); box-shadow: 0 8px 32px rgba(0,188,212,0.35); transition: all 0.25s ease; }
    .cta-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 48px rgba(0,188,212,0.45); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .fade-up { animation: fadeUp 0.6s ease both; }
  `;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: 'linear-gradient(160deg, #f0fdff 0%, #e0f7fa 40%, #f8fafc 100%)', minHeight: '100vh' }}>
      <style>{css}</style>

      {/* Sticky header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="RIT Gate" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>RIT Gate</span>
        </div>
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
      </nav>

      {/* Hero */}
      <section style={{ padding: '72px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,188,212,0.08)', color: '#0097A7', fontSize: 13, fontWeight: 700, letterSpacing: 1, padding: '6px 16px', borderRadius: 50, marginBottom: 20 }} className="fade-up">
          FEATURES
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: '#0f172a', letterSpacing: -1.5, marginBottom: 16, lineHeight: 1.1 }} className="fade-up">
          Why choose <span style={{ background: 'linear-gradient(135deg, #00BCD4, #0097A7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RIT Gate?</span>
        </h1>
        <p style={{ fontSize: 18, color: '#475569', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }} className="fade-up">
          Everything you need for a smooth, secure, and paperless campus visit experience.
        </p>
      </section>

      {/* Feature grid */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="feat-card"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 24px', background: 'linear-gradient(135deg, #006064 0%, #00838F 50%, #00BCD4 100%)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: -1 }}>Ready to visit our campus?</h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 32, lineHeight: 1.6 }}>Register now and get your digital pass in minutes.</p>
        <button className="cta-btn" onClick={onGetStarted}>
          <span>✏️</span> Register Your Visit <span>→</span>
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 24px', background: '#0f172a', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>© 2026 Rajalakshmi Institute of Technology. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FeaturesPage;
