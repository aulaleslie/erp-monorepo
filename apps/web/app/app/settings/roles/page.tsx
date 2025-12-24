"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RolesPage() {
    return (
        <PermissionGuard
            requiredPermissions={['roles.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view roles.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <PageHeader
                    title="Roles Management"
                    description="Manage roles and their permissions here."
                />

                {/* Future: Role list table */}
                <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">Role list will be implemented here.</p>
                </div>
            </div>
        </PermissionGuard>
    );
}
