// Central design tokens for the RIT Gate visitor website.
// Keeping these in one place makes the modern look consistent across pages.

export const theme = {
  color: {
    // Brand — RIT Gate cyan/teal, with deeper supporting shades for a richer look.
    brand: '#00BCD4',
    brandDark: '#0097A7',
    brandDeep: '#006064',
    brandSoft: '#E0F7FA',
    brandTint: 'rgba(0,188,212,0.10)',

    ink: '#0B1220',       // near-black headings
    body: '#475569',      // body text
    muted: '#64748B',     // secondary text
    line: '#E2E8F0',      // borders
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    surfaceSunken: '#F1F5F9',

    success: '#16A34A',
    successSoft: '#DCFCE7',
    warning: '#F59E0B',
    warningSoft: '#FEF3C7',
    danger: '#EF4444',
    dangerSoft: '#FEE2E2',
  },

  gradient: {
    brand: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
    brandDeep: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 50%, #006064 100%)',
    heroWash: 'linear-gradient(160deg, #F0FDFF 0%, #E0F7FA 42%, #F8FAFC 100%)',
    successText: 'linear-gradient(135deg, #16A34A, #059669)',
  },

  radius: {
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    pill: '999px',
  },

  shadow: {
    sm: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
    md: '0 8px 24px rgba(15,23,42,0.08)',
    lg: '0 20px 50px rgba(15,23,42,0.12)',
    brand: '0 12px 36px rgba(0,188,212,0.35)',
    brandSoft: '0 8px 24px rgba(0,188,212,0.16)',
  },

  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Max content width for centered sections.
  maxWidth: '1120px',
} as const;

export type Theme = typeof theme;
