import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  type: 'light' | 'dark';
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  surfaceHighlight: string;
  inputBackground: string;
  gradients: {
    primary: string[];
    secondary: string[];
    error: string[];
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  updateThemeColor: (key: keyof Theme, color: string) => void;
  resetTheme: () => void;
}

const lightTheme: Theme = {
  type: 'light',
  primary: '#22D3EE',
  secondary: '#0EA5E9',
  accent: '#22D3EE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  cardBackground: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#06B6D4',
  surfaceHighlight: '#F3F4F6',
  inputBackground: '#F9FAFB',
  gradients: {
    primary: ['#22D3EE', '#0EA5E9'],
    secondary: ['#0EA5E9', '#3B82F6'],
    error: ['#EF4444', '#DC2626'],
  },
};

const darkTheme: Theme = {
  type: 'dark',
  primary: '#22D3EE',
  secondary: '#0EA5E9',
  accent: '#22D3EE',
  background: '#0F172A',
  surface: '#1E293B',
  cardBackground: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  border: '#334155',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#06B6D4',
  surfaceHighlight: '#334155',
  inputBackground: '#1E293B',
  gradients: {
    primary: ['#22D3EE', '#0EA5E9'],
    secondary: ['#0EA5E9', '#3B82F6'],
    error: ['#EF4444', '#DC2626'],
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [customColors, setCustomColors] = useState<Partial<Theme>>({});

  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      const savedColors = await AsyncStorage.getItem('theme_colors');
      
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
      
      if (savedColors) {
        setCustomColors(JSON.parse(savedColors));
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem('theme_mode', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const updateThemeColor = async (key: keyof Theme, color: string) => {
    const newColors = { ...customColors, [key]: color };
    setCustomColors(newColors);
    try {
      await AsyncStorage.setItem('theme_colors', JSON.stringify(newColors));
    } catch (error) {
      console.error('Error saving theme colors:', error);
    }
  };

  const resetTheme = async () => {
    setCustomColors({});
    try {
      await AsyncStorage.removeItem('theme_colors');
    } catch (error) {
      console.error('Error resetting theme:', error);
    }
  };

  const baseTheme = isDark ? darkTheme : lightTheme;
  const theme = { ...baseTheme, ...customColors };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, updateThemeColor, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
