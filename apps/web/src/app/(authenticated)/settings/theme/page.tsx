"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { THEME_PRESETS } from "@gym-monorepo/shared";

export default function ThemeSettingsPage() {
  const { toast } = useToast();
  const { theme, isLoading, updateTheme } = useTheme();

  const [saving, setSaving] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Set initial selected preset when theme loads
  useEffect(() => {
    if (theme?.presetId) {
      setSelectedPresetId(theme.presetId);
    } else {
      setSelectedPresetId("corporate-blue");
    }
  }, [theme?.presetId]);

  const handleThemeSelect = async (presetId: string) => {
    setSaving(true);
    try {
      await updateTheme(presetId);
      setSelectedPresetId(presetId);
      toast({
        title: "Success",
        description: "Theme updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update theme.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme Settings"
        description="Customize your organization's color scheme and branding"
      />

      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <AlertDescription>
              Select a professional color preset for your organization. Changes apply instantly across the application.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(THEME_PRESETS).map(([presetId, preset]) => {
              const isSelected = selectedPresetId === presetId;
              const colors = preset.colors.light; // Show light variant in preview

              return (
                <Card
                  key={presetId}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary"
                  }`}
                  onClick={() => handleThemeSelect(presetId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {preset.description}
                        </CardDescription>
                      </div>
                      {isSelected && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Color Preview Grid */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Color Preview
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {/* Primary */}
                        <div className="flex flex-col gap-1">
                          <div
                            className="h-12 rounded border"
                            style={{
                              backgroundColor: `hsl(${colors.primary})`,
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Primary
                          </span>
                        </div>

                        {/* Secondary */}
                        <div className="flex flex-col gap-1">
                          <div
                            className="h-12 rounded border"
                            style={{
                              backgroundColor: `hsl(${colors.secondary})`,
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Secondary
                          </span>
                        </div>

                        {/* Accent */}
                        <div className="flex flex-col gap-1">
                          <div
                            className="h-12 rounded border"
                            style={{
                              backgroundColor: `hsl(${colors.accent})`,
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Accent
                          </span>
                        </div>

                        {/* Destructive */}
                        <div className="flex flex-col gap-1">
                          <div
                            className="h-12 rounded border"
                            style={{
                              backgroundColor: `hsl(${colors.destructive})`,
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Destructive
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Preview */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Sidebar
                      </div>
                      <div className="flex gap-1 rounded overflow-hidden border">
                        <div
                          className="flex-1 h-20 flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            backgroundColor: `hsl(${colors.sidebar})`,
                          }}
                        >
                          Menu
                        </div>
                        <div
                          className="flex-1 h-20 flex items-center justify-center text-xs text-muted-foreground bg-muted"
                        >
                          Content
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <div className="px-6 pb-4">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      disabled={isSelected || saving}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThemeSelect(presetId);
                      }}
                    >
                      {saving && isSelected && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isSelected ? "Applied" : "Apply"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
