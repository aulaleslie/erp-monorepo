"use client";

import { useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { THEME_PRESETS, ThemeColorSet } from "@gym-monorepo/shared";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeSelectorProps {
  value: string;
  onChange: (presetId: string) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function ThemeSelector({
  value,
  onChange,
  disabled = false,
  label = "Theme",
  description = "Select a color theme for this tenant. Changes will preview immediately.",
}: ThemeSelectorProps) {
  const { applyThemePreview, refreshTheme } = useTheme();
  const originalColorsRef = useRef<ThemeColorSet | null>(null);
  const initialValueRef = useRef<string | null>(null);

  // Use the value prop directly - this is a fully controlled component
  const selectedPresetId = value || "corporate-blue";

  // Store original theme on mount for restoration
  useEffect(() => {
    // Store the initial value to detect if user changed it
    initialValueRef.current = value;
    
    // Store original colors for potential restoration
    if (value && THEME_PRESETS[value]) {
      originalColorsRef.current = THEME_PRESETS[value].colors.light;
    }
    
    // On unmount, restore original theme if user didn't save
    return () => {
      // Refresh theme from server to restore to saved state
      refreshTheme();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme preview whenever the value changes
  useEffect(() => {
    if (selectedPresetId) {
      const preset = THEME_PRESETS[selectedPresetId];
      if (preset) {
        applyThemePreview(preset.colors.light);
      }
    }
  }, [selectedPresetId, applyThemePreview]);

  const handleThemeSelect = useCallback((presetId: string) => {
    if (disabled) return;
    
    // Notify parent of change
    onChange(presetId);

    // Apply preview immediately
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      applyThemePreview(preset.colors.light);
    }
  }, [disabled, onChange, applyThemePreview]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(THEME_PRESETS).map(([presetId, preset]) => {
          const isSelected = selectedPresetId === presetId;
          const colors = preset.colors.light;

          return (
            <Card
              key={presetId}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleThemeSelect(presetId)}
            >
              <CardHeader className="pb-2 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm">{preset.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5 line-clamp-1">
                      {preset.description}
                    </CardDescription>
                  </div>
                  {isSelected && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3 pt-0">
                {/* Color Preview */}
                <div className="flex gap-1">
                  <div
                    className="flex-1 h-6 rounded-sm"
                    style={{ backgroundColor: `hsl(${colors.primary})` }}
                    title="Primary"
                  />
                  <div
                    className="flex-1 h-6 rounded-sm"
                    style={{ backgroundColor: `hsl(${colors.secondary})` }}
                    title="Secondary"
                  />
                  <div
                    className="flex-1 h-6 rounded-sm"
                    style={{ backgroundColor: `hsl(${colors.accent})` }}
                    title="Accent"
                  />
                  <div
                    className="flex-1 h-6 rounded-sm"
                    style={{ backgroundColor: `hsl(${colors.sidebar})` }}
                    title="Sidebar"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
