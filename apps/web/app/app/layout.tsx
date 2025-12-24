"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard requireTenant={true}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </AuthGuard>
    );
}
