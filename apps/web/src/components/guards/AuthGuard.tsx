"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
    children: React.ReactNode;
    requireTenant?: boolean;
}

export const AuthGuard = ({ children, requireTenant = true }: AuthGuardProps) => {
    const { user, activeTenant, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (requireTenant && !activeTenant && pathname !== '/select-tenant') {
            router.push('/select-tenant');
        }

    }, [user, activeTenant, isLoading, router, pathname, requireTenant]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
                Loading...
            </div>
        );
    }

    // If redirected, render null until router pushes (optimization)
    if (!user || (requireTenant && !activeTenant)) {
        return null;
    }

    return <>{children}</>;
};
