/**
 * Theme configuration types for tenant-scoped styling.
 * Each preset includes both light and dark mode variants.
 * All colors are in HSL format (hue, saturation, lightness).
 */

// ============================================================================
// Theme Color Format
// ============================================================================

/**
 * HSL color string: "h s% l%"
 * Example: "222.2 47.4% 11.2%"
 */
export type HSLColor = string;

// ============================================================================
// Theme Preset Configuration
// ============================================================================

export interface ThemeColorSet {
  primary: HSLColor;
  primaryForeground: HSLColor;
  secondary: HSLColor;
  secondaryForeground: HSLColor;
  accent: HSLColor;
  accentForeground: HSLColor;
  muted: HSLColor;
  mutedForeground: HSLColor;
  destructive: HSLColor;
  destructiveForeground: HSLColor;
  border: HSLColor;
  background: HSLColor;
  foreground: HSLColor;
  sidebar: HSLColor;
  sidebarForeground: HSLColor;
}

export interface ThemeVariant {
  light: ThemeColorSet;
  dark: ThemeColorSet;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: ThemeVariant;
}

// ============================================================================
// Theme Settings Entity
// ============================================================================

export interface TenantThemeSettings {
  id: string;
  tenantId: string;
  presetId: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Predefined Professional ERP Color Presets
// ============================================================================

export const THEME_PRESETS: Record<string, ThemePreset> = {
  // Corporate Blue: Professional, trustworthy, widely used in enterprise software
  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue theme with strong contrast for enterprise environments',
    colors: {
      light: {
        primary: '222.2 47.4% 11.2%',
        primaryForeground: '210 40% 98%',
        secondary: '210 40% 96%',
        secondaryForeground: '222.2 47.4% 11.2%',
        accent: '217.2 91.2% 59.8%',
        accentForeground: '210 40% 98%',
        muted: '210 40% 96%',
        mutedForeground: '215.4 16.3% 46.9%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '210 40% 98%',
        border: '214.3 31.8% 91.4%',
        background: '0 0% 100%',
        foreground: '222.2 47.4% 11.2%',
        sidebar: '222.2 47.4% 11.2%',
        sidebarForeground: '210 40% 98%',
      },
      dark: {
        primary: '210 40% 98%',
        primaryForeground: '222.2 47.4% 11.2%',
        secondary: '217.2 32.6% 17.5%',
        secondaryForeground: '210 40% 98%',
        accent: '217.2 91.2% 59.8%',
        accentForeground: '222.2 47.4% 11.2%',
        muted: '217.2 32.6% 17.5%',
        mutedForeground: '215 20.2% 65.1%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '210 40% 98%',
        border: '217.2 32.6% 17.5%',
        background: '222.2 84% 4.9%',
        foreground: '210 40% 98%',
        sidebar: '222.2 47.4% 11.2%',
        sidebarForeground: '210 40% 98%',
      },
    },
  },

  // Forest Green: Eco-friendly, growth-oriented, modern appeal
  'forest-green': {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Eco-friendly green theme perfect for sustainability-focused businesses',
    colors: {
      light: {
        primary: '142.4 71.8% 29.4%',
        primaryForeground: '0 0% 100%',
        secondary: '142.4 71.8% 90.6%',
        secondaryForeground: '142.4 71.8% 29.4%',
        accent: '167.4 86.3% 39.2%',
        accentForeground: '0 0% 100%',
        muted: '0 0% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '214.3 31.8% 91.4%',
        background: '0 0% 100%',
        foreground: '0 0% 3.9%',
        sidebar: '142.4 71.8% 29.4%',
        sidebarForeground: '0 0% 100%',
      },
      dark: {
        primary: '142.4 71.8% 79.4%',
        primaryForeground: '142.4 71.8% 29.4%',
        secondary: '142.4 71.8% 20.6%',
        secondaryForeground: '142.4 71.8% 79.4%',
        accent: '167.4 86.3% 39.2%',
        accentForeground: '0 0% 100%',
        muted: '215.3 16.3% 20.9%',
        mutedForeground: '215 20.2% 65.1%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '215.3 16.3% 20.9%',
        background: '0 0% 3.9%',
        foreground: '0 0% 98%',
        sidebar: '142.4 71.8% 29.4%',
        sidebarForeground: '0 0% 100%',
      },
    },
  },

  // Slate Gray: Minimalist, professional, clean design aesthetic
  'slate-gray': {
    id: 'slate-gray',
    name: 'Slate Gray',
    description: 'Minimalist slate gray theme for a clean, modern enterprise look',
    colors: {
      light: {
        primary: '215.4 16.3% 46.9%',
        primaryForeground: '0 0% 100%',
        secondary: '215.3 16.3% 90.9%',
        secondaryForeground: '215.4 16.3% 46.9%',
        accent: '210.7 100% 50%',
        accentForeground: '0 0% 100%',
        muted: '210 40% 96%',
        mutedForeground: '215.4 16.3% 46.9%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '214.3 31.8% 91.4%',
        background: '0 0% 100%',
        foreground: '215.3 25% 26.9%',
        sidebar: '215.4 16.3% 46.9%',
        sidebarForeground: '0 0% 100%',
      },
      dark: {
        primary: '215 20.2% 65.1%',
        primaryForeground: '215.3 25% 26.9%',
        secondary: '215.4 16.3% 20.9%',
        secondaryForeground: '215 20.2% 65.1%',
        accent: '210.7 100% 50%',
        accentForeground: '0 0% 100%',
        muted: '215.4 16.3% 20.9%',
        mutedForeground: '215 20.2% 65.1%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '215.4 16.3% 20.9%',
        background: '215.3 25% 13.9%',
        foreground: '215 20.2% 93%',
        sidebar: '215.4 16.3% 46.9%',
        sidebarForeground: '0 0% 100%',
      },
    },
  },

  // Modern Purple: Creative, innovative, premium feel
  'modern-purple': {
    id: 'modern-purple',
    name: 'Modern Purple',
    description: 'Creative purple theme with modern gradient aesthetics',
    colors: {
      light: {
        primary: '280.7 85.8% 39.7%',
        primaryForeground: '0 0% 100%',
        secondary: '280.7 85.8% 90.3%',
        secondaryForeground: '280.7 85.8% 39.7%',
        accent: '292.2 100% 45%',
        accentForeground: '0 0% 100%',
        muted: '0 0% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '214.3 31.8% 91.4%',
        background: '0 0% 100%',
        foreground: '280.7 85.8% 20.3%',
        sidebar: '280.7 85.8% 39.7%',
        sidebarForeground: '0 0% 100%',
      },
      dark: {
        primary: '280.7 85.8% 89.7%',
        primaryForeground: '280.7 85.8% 39.7%',
        secondary: '280.7 85.8% 20.3%',
        secondaryForeground: '280.7 85.8% 89.7%',
        accent: '292.2 100% 45%',
        accentForeground: '0 0% 100%',
        muted: '215.3 16.3% 20.9%',
        mutedForeground: '215 20.2% 65.1%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '215.3 16.3% 20.9%',
        background: '280.7 85.8% 10.3%',
        foreground: '0 0% 98%',
        sidebar: '280.7 85.8% 39.7%',
        sidebarForeground: '0 0% 100%',
      },
    },
  },

  // Deep Teal: Balanced, calming, technology-focused
  'deep-teal': {
    id: 'deep-teal',
    name: 'Deep Teal',
    description: 'Balanced teal theme ideal for tech-forward organizations',
    colors: {
      light: {
        primary: '167.4 86.3% 39.2%',
        primaryForeground: '0 0% 100%',
        secondary: '167.4 86.3% 89.8%',
        secondaryForeground: '167.4 86.3% 39.2%',
        accent: '199.4 89.2% 48%',
        accentForeground: '0 0% 100%',
        muted: '0 0% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '214.3 31.8% 91.4%',
        background: '0 0% 100%',
        foreground: '167.4 86.3% 20.8%',
        sidebar: '167.4 86.3% 39.2%',
        sidebarForeground: '0 0% 100%',
      },
      dark: {
        primary: '167.4 86.3% 89.2%',
        primaryForeground: '167.4 86.3% 39.2%',
        secondary: '167.4 86.3% 20.8%',
        secondaryForeground: '167.4 86.3% 89.2%',
        accent: '199.4 89.2% 48%',
        accentForeground: '0 0% 100%',
        muted: '215.3 16.3% 20.9%',
        mutedForeground: '215 20.2% 65.1%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 100%',
        border: '215.3 16.3% 20.9%',
        background: '167.4 86.3% 9.2%',
        foreground: '0 0% 98%',
        sidebar: '167.4 86.3% 39.2%',
        sidebarForeground: '0 0% 100%',
      },
    },
  },
};

// ============================================================================
// Utility Types
// ============================================================================

export type ThemePresetId = keyof typeof THEME_PRESETS;
