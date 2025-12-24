"use client";

import { PermissionGuard } from "@/components/guards/PermissionGuard";

export default function UsersPage() {
    return (
        <PermissionGuard requiredPermissions={['users.read']} fallback={<div>Access Denied</div>}>
            <div>
                <h1 className="text-2xl font-bold mb-4">User Management</h1>
                <p>Manage users and assign roles here.</p>
                {/* Future: User list table */}
            </div>
        </PermissionGuard>
    );
}
