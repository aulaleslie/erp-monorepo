"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function PlatformTenantsPage() {
    const { user } = useAuth();

    if (!user?.isSuperAdmin) {
        return <div>Access Denied: Super Admin Only</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Platform Tenants</h1>
            <p>Manage all tenants in the system.</p>
            {/* Future: Tenant list table */}
        </div>
    );
}
