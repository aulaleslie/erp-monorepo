"use client";

import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { PERMISSIONS } from "@gym-monorepo/shared";
import { ReactNode } from "react";

export default function MembersLayout({ children }: { children: ReactNode }) {
    return (
        <PermissionGuard
            requiredPermissions={[PERMISSIONS.MEMBERS.READ]}
            fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">You do not have permission to view this section.</p>
                </div>
            }
        >
            {children}
        </PermissionGuard>
    );
}
