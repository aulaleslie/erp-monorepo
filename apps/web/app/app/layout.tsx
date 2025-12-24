"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard requireTenant={true}>
            <AppShell>
                {children}
            </AppShell>
        </AuthGuard>
    );
}
