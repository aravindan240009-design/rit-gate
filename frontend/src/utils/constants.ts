// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.29.223:8080/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  CURRENT_STUDENT: 'current_student',
  ENTRY_LOGS: 'entry_logs_',
  APP_SETTINGS: 'app_settings',
  OFFLINE_QUEUE: 'offline_queue',
};

// App Settings
export const APP_SETTINGS = {
  NOTIFICATIONS_ENABLED: true,
  BIOMETRIC_ENABLED: false,
  AUTO_SYNC: true,
  THEME: 'light',
};

// Colors
export const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  success: '#10B981',
  info: '#06B6D4',
  
  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Entry Types
export const ENTRY_TYPES = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
} as const;

// Entry Methods
export const ENTRY_METHODS = {
  CARD: 'Card',
  BIOMETRIC: 'Biometric',
  MANUAL: 'Manual',
  QR_CODE: 'QR Code',
} as const;

// Screen Names
export const SCREENS = {
  LOGIN: 'Login',
  DASHBOARD: 'Dashboard',
  PROFILE: 'Profile',
  HISTORY: 'History',
  SETTINGS: 'Settings',
} as const;
