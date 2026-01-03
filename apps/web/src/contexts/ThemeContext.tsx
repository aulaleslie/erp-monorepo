"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { THEME_PRESETS, ThemeVariant } from "@gym-monorepo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface TenantTheme {
  presetId: string;
  colors: ThemeVariant;
  logoUrl?: string;
}

interface ThemeContextType {
  theme: TenantTheme | null;
  isLoading: boolean;
  updateTheme: (presetId: string, logoUrl?: string) => Promise<void>;
  applyThemeColors: (variant: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeTenant } = useAuth();
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply CSS variables to the document root
  const applyThemeColors = useCallback((variant: "light" | "dark") => {
    if (!theme) return;

    const colors = theme.colors[variant];
    const root = document.documentElement;

    // Apply all color variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });
  }, [theme]);

  // Fetch theme settings when active tenant changes
  useEffect(() => {
    if (!activeTenant?.id) {
      setTheme(null);
      setIsLoading(false);
      return;
    }

    const fetchTheme = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<TenantTheme>(
          "/tenant-settings/theme"
        );
        setTheme(response.data);

        // Apply light mode by default (can be enhanced to detect system preference)
        // Use a setTimeout to ensure DOM is ready
        setTimeout(() => {
          applyThemeColors("light");
        }, 0);
      } catch (error) {
        console.error("Failed to fetch theme settings:", error);
        // Fall back to default theme
        setTheme({
          presetId: "corporate-blue",
          colors: THEME_PRESETS["corporate-blue"].colors,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [activeTenant?.id, applyThemeColors]);

  const updateTheme = useCallback(
    async (presetId: string, logoUrl?: string) => {
      if (!activeTenant?.id) {
        throw new Error("No active tenant");
      }

      try {
        await api.put("/tenant-settings/theme", {
          presetId,
          logoUrl,
        });

        // Update local state
        const preset = THEME_PRESETS[presetId];
        if (preset) {
          setTheme({
            presetId,
            colors: preset.colors,
            logoUrl,
          });

          // Apply the new theme colors
          applyThemeColors("light");
        }
      } catch (error) {
        console.error("Failed to update theme settings:", error);
        throw error;
      }
    },
    [activeTenant?.id, applyThemeColors]
  );

  return (
    <ThemeContext.Provider value={{ theme, isLoading, updateTheme, applyThemeColors }}>
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
