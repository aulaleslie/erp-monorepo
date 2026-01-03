"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { THEME_PRESETS, ThemeVariant, ThemeColorSet } from "@gym-monorepo/shared";
import { useAuth } from "@/contexts/AuthContext";
import { getTenantThemeSettings, updateTenantThemeSettings } from "@/lib/api/tenant-settings";

interface TenantTheme {
  presetId: string;
  colors: ThemeVariant;
  logoUrl?: string;
}

interface ThemeContextType {
  theme: TenantTheme | null;
  isLoading: boolean;
  updateTheme: (presetId: string, logoUrl?: string) => Promise<void>;
  applyThemePreview: (colors: ThemeColorSet) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// CSS variable mapping for theme colors
const COLOR_MAPPING: Record<string, string> = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  input: '--input',
  ring: '--ring',
  sidebar: '--sidebar',
  sidebarForeground: '--sidebar-foreground',
  sidebarAccent: '--sidebar-accent',
  sidebarAccentForeground: '--sidebar-accent-foreground',
  sidebarBorder: '--sidebar-border',
};

// Apply theme colors to CSS variables
const applyCssVariables = (colors: ThemeColorSet) => {
  const root = document.documentElement;
  
  Object.entries(COLOR_MAPPING).forEach(([key, cssVar]) => {
    const colorKey = key as keyof ThemeColorSet;
    if (colors[colorKey]) {
      root.style.setProperty(cssVar, colors[colorKey]);
    }
  });
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeTenant } = useAuth();
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchedTenantId = useRef<string | null>(null);

  // Function to fetch theme - extracted for reuse
  const fetchTheme = useCallback(async () => {
    if (!activeTenant?.id) {
      setTheme(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getTenantThemeSettings();
      const themeData = response.data;
      setTheme(themeData);

      // Apply light mode theme
      if (themeData?.colors?.light) {
        applyCssVariables(themeData.colors.light);
      }
    } catch (error) {
      console.error("Failed to fetch theme settings:", error);
      // Fall back to default theme
      const defaultPresetId = "corporate-blue";
      const defaultPreset = THEME_PRESETS[defaultPresetId];
      
      if (defaultPreset) {
        setTheme({
          presetId: defaultPresetId,
          colors: defaultPreset.colors,
        });
        applyCssVariables(defaultPreset.colors.light);
      } else {
        setTheme(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.id]);

  // Fetch theme settings when active tenant changes
  useEffect(() => {
    // Only fetch if tenant actually changed
    if (lastFetchedTenantId.current === activeTenant?.id) {
      return;
    }
    
    lastFetchedTenantId.current = activeTenant?.id ?? null;
    fetchTheme();
  }, [activeTenant?.id, fetchTheme]);

  // Apply theme preview without saving
  const applyThemePreview = useCallback((colors: ThemeColorSet) => {
    applyCssVariables(colors);
  }, []);

  // Refresh theme from server
  const refreshTheme = useCallback(async () => {
    await fetchTheme();
  }, [fetchTheme]);

  const updateTheme = useCallback(
    async (presetId: string, logoUrl?: string) => {
      if (!activeTenant?.id) {
        throw new Error("No active tenant");
      }

      try {
        await updateTenantThemeSettings({
          presetId,
          logoUrl,
        });

        // Update local state
        const preset = THEME_PRESETS[presetId];
        if (preset) {
          const newTheme = {
            presetId,
            colors: preset.colors,
            logoUrl,
          };
          setTheme(newTheme);
          applyCssVariables(preset.colors.light);
        }
      } catch (error) {
        console.error("Failed to update theme settings:", error);
        throw error;
      }
    },
    [activeTenant?.id]
  );

  return (
    <ThemeContext.Provider value={{ theme, isLoading, updateTheme, applyThemePreview, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
