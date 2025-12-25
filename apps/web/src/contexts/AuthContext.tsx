"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface User {
    id: string;
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [hasTenants, setHasTenants] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                // ... comments
            });
            if (res.ok) {
                const responseData = await res.json();
                setUser(responseData.data);
                return true;
            } else {
                setUser(null);
                return false;
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setUser(null);
            return false;
        }
    };

    const fetchActiveTenant = async () => {
        try {
            const res = await fetch(`${API_URL}/me/tenants/active`, { credentials: 'include' });
            if (res.ok) {
                const responseData = await res.json();
                setActiveTenant(responseData.data);
            } else {
                setActiveTenant(null);
            }
        } catch (error) {
            console.error("Failed to fetch active tenant:", error);
            setActiveTenant(null);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await fetch(`${API_URL}/me/permissions`, { credentials: 'include' });
            if (res.ok) {
                const responseData = await res.json();
                setPermissions(responseData.data);
            } else {
                setPermissions(null);
            }
        } catch (error) {
            console.error("Failed to fetch permissions:", error);
            setPermissions(null);
        }
    };

    const refreshAuth = useCallback(async () => {
        setIsLoading(true);
        // Needed to ensure cookies are sent
        // We are adding specific headers just in case of proxy issues, but standard fetch usually suffices if proxy handled.
        // Actually, creating a wrapper for fetch that adds credentials: 'include' is better practice.
        // For now, I'll add it here.

        // Note: If separate domains (3000 vs 4000), we MUST use credentials: 'include'.
        // And backend must allow origin 3000 with credentials.

        // Changing fetch to include credentials.
        try {
            const [userRes, tenantRes, permRes, myTenantsRes] = await Promise.allSettled([
                fetch(`${API_URL}/auth/me`, { credentials: 'include' }),
                fetch(`${API_URL}/me/tenants/active`, { credentials: 'include' }),
                fetch(`${API_URL}/me/permissions`, { credentials: 'include' }),
                fetch(`${API_URL}/me/tenants`, { credentials: 'include' })
            ]);

            if (userRes.status === 'fulfilled' && userRes.value.ok) {
                const data = await userRes.value.json();
                setUser(data.data);
            } else {
                setUser(null);
            }

            if (tenantRes.status === 'fulfilled' && tenantRes.value.ok) {
                const data = await tenantRes.value.json();
                setActiveTenant(data.data);
            } else {
                setActiveTenant(null);
            }

            if (permRes.status === 'fulfilled' && permRes.value.ok) {
                const data = await permRes.value.json();
                setPermissions(data.data);
            } else {
                setPermissions(null);
            }

            // Check if user has any tenants
            if (myTenantsRes.status === 'fulfilled' && myTenantsRes.value.ok) {
                const data = await myTenantsRes.value.json();
                const tenants = data.data || [];
                setHasTenants(tenants.length > 0);
            } else {
                setHasTenants(false);
            }
        } catch (e) {
            console.error("Auth init error", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshPermissions = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/me/permissions`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPermissions(data.data);
            }
            const tenantRes = await fetch(`${API_URL}/me/tenants/active`, { credentials: 'include' });
            if (tenantRes.ok) {
                const data = await tenantRes.json();
                setActiveTenant(data.data);
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
