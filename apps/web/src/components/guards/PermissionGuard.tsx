"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { ReactNode } from "react";

interface PermissionGuardProps {
    children: ReactNode;
    requiredPermissions: string[];
    fallback?: ReactNode;
    requireAll?: boolean;
}

export const PermissionGuard = ({
    children,
    requiredPermissions,
    fallback = null,
    requireAll = false
}: PermissionGuardProps) => {
    const { can, canAny, isSuperAdmin } = usePermissions();

    if (isSuperAdmin) return <>{children}</>;

    const hasAccess = requireAll
        ? requiredPermissions.every(p => can(p))
        : canAny(requiredPermissions);

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
