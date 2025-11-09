/**
 * Discovery Screen Theme & Shared Styles
 *
 * Provides light/dark theme colors and shared style utilities
 * for the Discovery screen and its components.
 */

export interface Theme {
  background: string;
  foreground: string;

  card: string;
  cardBorder: string;

  primary: string;
  primaryForeground: string;

  muted: string;
  mutedForeground: string;

  accent: string;

  border: string;
  input: string;
}

// Light mode theme (default)
export const lightTheme: Theme = {
  background: '#FFFFFF',
  foreground: '#111827',

  card: '#FFFFFF',
  cardBorder: '#E5E7EB',

  primary: '#6366F1',
  primaryForeground: '#FFFFFF',

  muted: '#F9FAFB',
  mutedForeground: '#6B7280',

  accent: '#F59E0B',

  border: '#E5E7EB',
  input: '#F9FAFB',
};

// Dark mode theme (for future use)
export const darkTheme: Theme = {
  background: '#0A0E27',
  foreground: '#F9FAFB',

  card: '#1A1F3A',
  cardBorder: '#374151',

  primary: '#818CF8',
  primaryForeground: '#111827',

  muted: '#1F2937',
  mutedForeground: '#6B7280',

  accent: '#FBBF24',

  border: '#374151',
  input: '#1F2937',
};

// Current theme (light for now)
export const currentTheme = lightTheme;

// Shared spacing constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Shared border radius
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 18,
  full: 999,
};

// Animation timing
export const animationDuration = {
  fast: 150,
  normal: 200,
  slow: 300,
};
