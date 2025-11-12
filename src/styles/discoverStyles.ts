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

// Light mode theme (modern, clean aesthetic)
export const lightTheme: Theme = {
  background: '#FAFBFC',         // Light cream (not pure white)
  foreground: '#0F172A',         // Almost black

  card: '#FFFFFF',               // Pure white cards
  cardBorder: '#E2E8F0',         // Soft border

  primary: '#7C3AED',            // Vibrant purple
  primaryForeground: '#FFFFFF',

  muted: '#F1F5F9',              // Subtle muted bg
  mutedForeground: '#64748B',    // Secondary text

  accent: '#F472B6',             // Pink accent

  border: '#E2E8F0',
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

// Shared border radius (updated for modern look)
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,           // Cards (increased from 12)
  xl: 20,           // Hero cards (increased from 16)
  pill: 999,        // Fully rounded pills
  full: 999,
};

// Animation timing
export const animationDuration = {
  fast: 150,
  normal: 200,
  slow: 300,
};

// iOS-style shadows
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
};
