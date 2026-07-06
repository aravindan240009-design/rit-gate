export const theme = {
  color: {
    brand: '#172b4d',
    brandMid: '#1e3a5f',
    brandLight: '#2563eb',
    brandSoft: '#eff6ff',
    brandTint: 'rgba(37,99,235,0.08)',

    ink: '#0f172a',
    body: '#475569',
    muted: '#94a3b8',
    line: '#e2e8f0',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    surfaceSunken: '#f1f5f9',

    success: '#16a34a',
    successSoft: '#dcfce7',
    warning: '#f59e0b',
    warningSoft: '#fef3c7',
    danger: '#ef4444',
    dangerSoft: '#fee2e2',
  },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '999px' },
  shadow: {
    sm: '0 1px 3px rgba(15,23,42,0.06)',
    md: '0 4px 12px rgba(15,23,42,0.08)',
    lg: '0 8px 24px rgba(15,23,42,0.10)',
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
} as const;
