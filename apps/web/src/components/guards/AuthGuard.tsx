"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface AuthGuardProps {
    children: React.ReactNode;
    requireTenant?: boolean;
}

export const AuthGuard = ({ children, requireTenant = true }: AuthGuardProps) => {
    const { user, activeTenant, hasTenants, isLoading } = useAuth();
    const t = useTranslations("authGuard");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        // Only redirect to select-tenant if:
        // 1. Tenant is required
        // 2. No active tenant selected
        // 3. User HAS tenants to select from (hasTenants === true)
        // 4. Not already on select-tenant page
        if (requireTenant && !activeTenant && hasTenants === true && pathname !== '/select-tenant') {
            router.push('/select-tenant');
        }

    }, [user, activeTenant, hasTenants, isLoading, router, pathname, requireTenant]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
                {t('loading')}
            </div>
        );
    }

    // If redirected, render null until router pushes (optimization)
    // Allow users without tenants to access the app
    if (!user) {
        return null;
    }

    // Only block if tenant required AND user has tenants but no active one selected
    if (requireTenant && !activeTenant && hasTenants === true) {
        return null;
    }

    return <>{children}</>;
};
