"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UsersPage() {
    return (
        <PermissionGuard
            requiredPermissions={['users.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view users.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <PageHeader
                    title="User Management"
                    description="Manage users and assign roles here."
                />

                {/* Future: User list table */}
                <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">User list will be implemented here.</p>
                </div>
            </div>
        </PermissionGuard>
    );
}
