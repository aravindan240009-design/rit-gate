import React, { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [hoveredCard, setHoveredCard] = useState<string>('');

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    heroSection: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center' as const,
      animation: 'fadeIn 1s ease-out',
    },
    heroContent: {
      maxWidth: '900px',
      width: '100%',
    },
    logoContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '32px',
      animation: 'slideDown 0.8s ease-out',
    },
    logoImage: {
      width: '180px',
      height: '180px',
      objectFit: 'contain' as const,
      filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))',
    },
    institutionName: {
      fontSize: '48px',
      fontWeight: '900',
      color: '#2d3748',
      margin: 0,
      textShadow: '0 2px 10px rgba(0,0,0,0.1)',
      letterSpacing: '-1px',
    },
    heroTitle: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#2d3748',
      marginBottom: '20px',
      textShadow: '0 2px 8px rgba(0,0,0,0.05)',
      animation: 'slideUp 0.8s ease-out',
    },
    heroSubtitle: {
      fontSize: '20px',
      color: '#4a5568',
      marginBottom: '48px',
      lineHeight: '1.6',
      maxWidth: '700px',
      margin: '0 auto 48px',
      animation: 'slideUp 1s ease-out',
    },
    ctaButton: (isHovered: boolean) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '18px 48px',
      fontSize: '18px',
      fontWeight: '700',
      color: '#ffffff',
      background: isHovered ? 'linear-gradient(135deg, #0097A7 0%, #00BCD4 100%)' : 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: isHovered ? '0 15px 40px rgba(0, 188, 212, 0.4)' : '0 10px 30px rgba(0, 188, 212, 0.3)',
      transform: isHovered ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
      animation: 'pulse 2s ease-in-out infinite',
    }),
    ctaIcon: {
      fontSize: '24px',
    },
    ctaArrow: {
      fontSize: '24px',
      transition: 'transform 0.3s ease',
    },
    heroStats: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '48px',
      marginTop: '64px',
      flexWrap: 'wrap' as const,
      animation: 'fadeIn 1.2s ease-out',
    },
    statItem: {
      textAlign: 'center' as const,
    },
    statNumber: {
      fontSize: '36px',
      fontWeight: '800',
      color: '#00BCD4',
      marginBottom: '8px',
      textShadow: '0 2px 10px rgba(0, 188, 212, 0.2)',
    },
    statLabel: {
      fontSize: '14px',
      color: '#4a5568',
      fontWeight: '500',
    },
    statDivider: {
      width: '2px',
      height: '60px',
      background: '#e2e8f0',
    },
    featuresSection: {
      padding: '80px 20px',
      background: '#f7fafc',
    },
    sectionTitle: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#2d3748',
      textAlign: 'center' as const,
      marginBottom: '48px',
      textShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '32px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    featureCard: (isHovered: boolean) => ({
      background: '#ffffff',
      borderRadius: '20px',
      padding: '40px 32px',
      textAlign: 'center' as const,
      transition: 'all 0.3s ease',
      boxShadow: isHovered ? '0 15px 40px rgba(0,0,0,0.15)' : '0 8px 25px rgba(0,0,0,0.08)',
      transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
      cursor: 'default',
      border: isHovered ? '2px solid #00BCD4' : '2px solid transparent',
    }),
    featureIcon: {
      fontSize: '56px',
      marginBottom: '20px',
      display: 'block',
    },
    featureTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#00BCD4',
      marginBottom: '12px',
    },
    featureDescription: {
      fontSize: '15px',
      color: '#6b7280',
      lineHeight: '1.6',
      margin: 0,
    },
    infoSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '60px 20px',
    },
    infoCard: (isHovered: boolean) => ({
      background: '#ffffff',
      borderRadius: '16px',
      padding: '32px 24px',
      textAlign: 'center' as const,
      transition: 'all 0.3s ease',
      border: isHovered ? '2px solid #00BCD4' : '2px solid #e2e8f0',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      boxShadow: isHovered ? '0 8px 20px rgba(0, 188, 212, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
    }),
    infoIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      display: 'block',
    },
    infoTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#2d3748',
      marginBottom: '8px',
    },
    infoText: {
      fontSize: '15px',
      color: '#4a5568',
      lineHeight: '1.5',
      margin: 0,
    },
    footer: {
      padding: '32px 20px',
      textAlign: 'center' as const,
      background: '#f7fafc',
      borderTop: '1px solid #e2e8f0',
    },
    footerText: {
      fontSize: '14px',
      color: '#718096',
      margin: 0,
    },
  };

  const keyframes = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 10px 30px rgba(0, 188, 212, 0.3);
      }
      50% {
        box-shadow: 0 15px 40px rgba(0, 188, 212, 0.5);
      }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.logoContainer}>
            <img 
              src="/logo.png" 
              alt="RIT Gate Logo" 
              style={styles.logoImage}
            />
            <h1 style={styles.institutionName}>RIT Gate</h1>
          </div>
          
          <h2 style={styles.heroTitle}>Visitor Management System</h2>
          <p style={styles.heroSubtitle}>
            Welcome to our campus. Register your visit in seconds and receive your digital pass instantly.
          </p>
          
          <button 
            style={styles.ctaButton(hoveredCard === 'cta')}
            onClick={onGetStarted}
            onMouseEnter={() => setHoveredCard('cta')}
            onMouseLeave={() => setHoveredCard('')}
          >
            <span style={styles.ctaIcon}>✎</span>
            Register Your Visit
            <span style={{
              ...styles.ctaArrow,
              transform: hoveredCard === 'cta' ? 'translateX(4px)' : 'translateX(0)',
            }}>→</span>
          </button>
          
          <div style={styles.heroStats}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>5000+</div>
              <div style={styles.statLabel}>Visitors Registered</div>
            </div>
            <div style={styles.statDivider}></div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>&lt; 2 min</div>
              <div style={styles.statLabel}>Average Registration Time</div>
            </div>
            <div style={styles.statDivider}></div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>24/7</div>
              <div style={styles.statLabel}>System Availability</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div style={styles.featuresSection}>
        <h3 style={styles.sectionTitle}>How It Works</h3>
        <div style={styles.featuresGrid}>
          <div 
            style={styles.featureCard(hoveredCard === 'feature1')}
            onMouseEnter={() => setHoveredCard('feature1')}
            onMouseLeave={() => setHoveredCard('')}
          >
            <span style={styles.featureIcon}>📝</span>
            <h4 style={styles.featureTitle}>1. Fill the Form</h4>
            <p style={styles.featureDescription}>
              Provide your basic details and purpose of visit in our simple form
            </p>
          </div>
          
          <div 
            style={styles.featureCard(hoveredCard === 'feature2')}
            onMouseEnter={() => setHoveredCard('feature2')}
            onMouseLeave={() => setHoveredCard('')}
          >
            <span style={styles.featureIcon}>⚡</span>
            <h4 style={styles.featureTitle}>2. Instant Approval</h4>
            <p style={styles.featureDescription}>
              Get immediate confirmation and your unique visitor QR code
            </p>
          </div>
          
          <div 
            style={styles.featureCard(hoveredCard === 'feature3')}
            onMouseEnter={() => setHoveredCard('feature3')}
            onMouseLeave={() => setHoveredCard('')}
          >
            <span style={styles.featureIcon}>📱</span>
            <h4 style={styles.featureTitle}>3. Show & Enter</h4>
            <p style={styles.featureDescription}>
              Present your QR code at the gate for quick and secure entry
            </p>
          </div>
        </div>
      </div>
      
      {/* Info Section */}
      <div style={styles.infoSection}>
        <div 
          style={styles.infoCard(hoveredCard === 'info1')}
          onMouseEnter={() => setHoveredCard('info1')}
          onMouseLeave={() => setHoveredCard('')}
        >
          <span style={styles.infoIcon}>🔒</span>
          <h4 style={styles.infoTitle}>Secure & Private</h4>
          <p style={styles.infoText}>Your information is encrypted and stored securely</p>
        </div>
        
        <div 
          style={styles.infoCard(hoveredCard === 'info2')}
          onMouseEnter={() => setHoveredCard('info2')}
          onMouseLeave={() => setHoveredCard('')}
        >
          <span style={styles.infoIcon}>⏱️</span>
          <h4 style={styles.infoTitle}>Quick Process</h4>
          <p style={styles.infoText}>Complete registration in under 2 minutes</p>
        </div>
        
        <div 
          style={styles.infoCard(hoveredCard === 'info3')}
          onMouseEnter={() => setHoveredCard('info3')}
          onMouseLeave={() => setHoveredCard('')}
        >
          <span style={styles.infoIcon}>📞</span>
          <h4 style={styles.infoTitle}>24/7 Support</h4>
          <p style={styles.infoText}>Need help? Contact security at the gate</p>
        </div>
      </div>
      
      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          © 2026 RIT Gate. All rights reserved. | Powered by Campus Security
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
