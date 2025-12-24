"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/use-permissions";

export default function TenantsPage() {
    // This page is superAdminOnly in sidebar, but we should double guard it.
    // The previous implementation didn't seem to have a guard wrapper maybe?
    // We'll wrap it in PermissionGuard but PermissionGuard checks specific permissions.
    // Is there a superAdmin check in PermissionGuard? Yes, but what permission to require?
    // If it's pure superadmin, maybe a separate check? 
    // PermissionGuard allows access if user is superAdmin regardless of requiredPermissions.
    // So we can pass a dummy permission or better, create a SuperAdminGuard.
    // For now, I'll use PermissionGuard with a made-up permission 'platform.tenants.manage' 
    // BUT since superAdmin bypasses, it works.

    // Actually, sidebar used superAdminOnly.
    // Let's use usePermissions directly for explicit super admin check if not using a specific permission.

    const { isSuperAdmin } = usePermissions();

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Access Denied. Super Admin only.</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tenants Management"
                description="Manage platform tenants."
            />

            <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Tenant list (Platform) will be implemented here.</p>
            </div>
        </div>
    );
}
