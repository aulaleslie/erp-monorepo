"use client";

import { useAuth } from "@/contexts/AuthContext";
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
    const { permissions, user } = useAuth();

    if (!user) return <>{fallback}</>;

    // Super Admin bypass
    if (user.isSuperAdmin || permissions?.superAdmin) {
        return <>{children}</>;
    }

    if (!permissions || !permissions.permissions) {
        return <>{fallback}</>;
    }

    const userPerms = permissions.permissions;

    // Check
    let hasAccess = false;

    if (requireAll) {
        hasAccess = requiredPermissions.every(p => userPerms.includes(p));
    } else {
        hasAccess = requiredPermissions.some(p => userPerms.includes(p));
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
