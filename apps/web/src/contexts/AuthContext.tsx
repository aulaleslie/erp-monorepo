"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { TenantType, Locale } from "@gym-monorepo/shared";
import { apiRaw } from "@/lib/api";

interface User {
    id: string;
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
    imageUrl?: string;
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
    type: TenantType;
    isTaxable: boolean;
    language: Locale;
}

interface Permissions {
    superAdmin: boolean;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    activeTenant: Tenant | null;
    permissions: Permissions | null;
    hasTenants: boolean | null; // null = not yet checked, true/false = has/doesn't have tenants
    isLoading: boolean;
    refreshPermissions: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [hasTenants, setHasTenants] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use Promise.allSettled to fetch all data in parallel
            // apiRaw doesn't unwrap responses, giving us full control
            const [userRes, tenantRes, permRes, myTenantsRes] = await Promise.allSettled([
                apiRaw.get('/auth/me'),
                apiRaw.get('/me/tenants/active'),
                apiRaw.get('/me/permissions'),
                apiRaw.get('/me/tenants')
            ]);

            // Handle user response
            if (userRes.status === 'fulfilled' && userRes.value.data?.success) {
                setUser(userRes.value.data.data);
            } else {
                setUser(null);
            }

            // Handle active tenant response
            if (tenantRes.status === 'fulfilled' && tenantRes.value.data?.success) {
                setActiveTenant(tenantRes.value.data.data);
            } else {
                setActiveTenant(null);
            }

            // Handle permissions response
            if (permRes.status === 'fulfilled' && permRes.value.data?.success) {
                setPermissions(permRes.value.data.data);
            } else {
                setPermissions(null);
            }

            // Check if user has any tenants
            if (myTenantsRes.status === 'fulfilled' && myTenantsRes.value.data?.success) {
                const tenants = myTenantsRes.value.data.data || [];
                setHasTenants(tenants.length > 0);
            } else {
                setHasTenants(false);
            }
        } catch (e) {
            console.error("Auth init error", e);
            setUser(null);
            setActiveTenant(null);
            setPermissions(null);
            setHasTenants(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshPermissions = useCallback(async () => {
        try {
            const [permRes, tenantRes] = await Promise.allSettled([
                apiRaw.get('/me/permissions'),
                apiRaw.get('/me/tenants/active')
            ]);

            if (permRes.status === 'fulfilled' && permRes.value.data?.success) {
                setPermissions(permRes.value.data.data);
            }

            if (tenantRes.status === 'fulfilled' && tenantRes.value.data?.success) {
                setActiveTenant(tenantRes.value.data.data);
            }
        } catch (e) {
            console.error("Refresh permissions error", e);
        }
    }, []);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

    return (
        <AuthContext.Provider value={{ user, activeTenant, permissions, hasTenants, isLoading, refreshPermissions, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
