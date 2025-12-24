"use client";

import { PermissionGuard } from "@/components/guards/PermissionGuard";

export default function RolesPage() {
    return (
        <PermissionGuard requiredPermissions={['roles.read']} fallback={<div>Access Denied</div>}>
            <div>
                <h1 className="text-2xl font-bold mb-4">Roles Management</h1>
                <p>Manage roles and their permissions here.</p>
                {/* Future: Role list table */}
            </div>
        </PermissionGuard>
    );
}
