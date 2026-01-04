"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/components/providers/LocaleProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LocaleProvider>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </LocaleProvider>
        </AuthProvider>
    );
}
