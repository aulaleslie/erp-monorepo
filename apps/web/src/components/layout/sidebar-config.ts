import type { ElementType } from "react";
import {
    Home,
    Settings,
    Shield,
    Users,
    Building,
    Building2,
    Percent,
    History,
} from "lucide-react";

export interface SidebarItem {
    label: string;
    icon: ElementType;
    href?: string;
    permissions?: string[];
    routePermissions?: string[];
    superAdminOnly?: boolean;
    children?: SidebarItem[];
}

export interface SidebarAccess {
    href: string;
    permissions: string[];
    superAdminOnly: boolean;
}

export const sidebarConfig: SidebarItem[] = [
    {
        label: "Dashboard",
        icon: Home,
        href: "/dashboard",
    },
    {
        label: "Settings",
        icon: Settings,
        children: [
            {
                label: "Tenant",
                icon: Building,
                href: "/settings/tenant",
                permissions: ["settings.tenant.read", "settings.tenant.update"],
                routePermissions: ["settings.tenant.read", "settings.tenant.update"],
            },
            {
                label: "Tenants",
                icon: Building2,
                href: "/settings/tenants",
                superAdminOnly: true,
            },
            {
                label: "Taxes",
                icon: Percent,
                href: "/settings/taxes",
                superAdminOnly: true,
            },
            {
                label: "Audit Logs",
                icon: History,
                href: "/settings/audit-logs",
                superAdminOnly: true,
            },
            {
                label: "Roles",
                icon: Shield,
                href: "/settings/roles",
                permissions: [
                    "roles.read",
                    "roles.create",
                    "roles.update",
                    "roles.delete",
                ],
                routePermissions: ["roles.read"],
            },
            {
                label: "Users",
                icon: Users,
                href: "/settings/users",
                permissions: [
                    "users.read",
                    "users.create",
                    "users.update",
                    "users.assignRole",
                ],
                routePermissions: ["users.read"],
            },
        ],
    },
];

const normalizePath = (path: string) => path.split("?")[0]?.split("#")[0] ?? path;

const isPathMatch = (path: string, href: string) =>
    path === href || path.startsWith(`${href}/`);

const findItemByPath = (items: SidebarItem[], path: string): SidebarItem | null => {
    for (const item of items) {
        if (item.href && isPathMatch(path, item.href)) {
            return item;
        }
        if (item.children) {
            const found = findItemByPath(item.children, path);
            if (found) {
                return found;
            }
        }
    }
    return null;
};

export const getSidebarAccessForPath = (path: string): SidebarAccess | null => {
    const normalizedPath = normalizePath(path);
    const match = findItemByPath(sidebarConfig, normalizedPath);

    if (!match?.href) {
        return null;
    }

    return {
        href: match.href,
        permissions: match.routePermissions ?? match.permissions ?? [],
        superAdminOnly: !!match.superAdminOnly,
    };
};
