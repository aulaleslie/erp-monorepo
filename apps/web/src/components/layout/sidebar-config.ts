import type { ElementType } from "react";
import {
    Home,
    Settings,
    Shield,
    Users,
    User,
    Building,
    Building2,
    Percent,
    History,
    Network,
    Package,
    ShoppingBag,
    Layers,
    UserCheck,
    Calendar,
    ShoppingCart,
    CreditCard,
    Tag,
    FileText,
    FileMinus,
    CheckCircle2,
} from "lucide-react";

export interface SidebarItem {
    label: string;
    icon: ElementType;
    labelKey?: string;
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
        labelKey: "dashboard",
        icon: Home,
        href: "/dashboard",
    },
    {
        label: "Member Management",
        labelKey: "memberManagement",
        icon: Users,
        children: [
            {
                label: "Members",
                labelKey: "members",
                icon: UserCheck,
                href: "/members",
            },
            {
                label: "Scheduling",
                labelKey: "scheduling",
                icon: Calendar,
                href: "/scheduling",
            },
        ],
    },
    {
        label: "Inventory & Sales",
        labelKey: "inventorySales",
        icon: Package,
        children: [
            {
                label: "Items",
                labelKey: "items",
                icon: ShoppingBag,
                href: "/catalog/items",
                permissions: [
                    "items.read",
                    "items.create",
                    "items.update",
                    "items.delete",
                ],
                routePermissions: ["items.read"],
            },
            {
                label: "Categories",
                labelKey: "categories",
                icon: Layers,
                href: "/catalog/categories",
                permissions: [
                    "categories.read",
                    "categories.create",
                    "categories.update",
                    "categories.delete",
                ],
                routePermissions: ["categories.read"],
            },
            {
                label: "Inventory",
                labelKey: "inventory",
                icon: Package,
                href: "/inventory",
            },
            {
                label: "Sales Orders",
                labelKey: "salesOrders",
                icon: ShoppingCart,
                href: "/sales/orders",
                permissions: ["sales.read"],
            },
            {
                label: "Invoices",
                labelKey: "invoices",
                icon: FileText,
                href: "/sales/invoices",
                permissions: ["sales.read"],
            },
            {
                label: "Credit Notes",
                labelKey: "creditNotes",
                icon: FileMinus,
                href: "/sales/credit-notes",
                permissions: ["sales.read"],
            },
            {
                label: "Approvals",
                labelKey: "salesApprovals",
                icon: CheckCircle2,
                children: [
                    {
                        label: "Orders",
                        labelKey: "approvalOrders",
                        icon: ShoppingCart,
                        href: "/sales/orders/approvals",
                        permissions: ["sales.read"], // Or specific approval permission
                    },
                    {
                        label: "Invoices",
                        labelKey: "approvalInvoices",
                        icon: FileText,
                        href: "/sales/invoices/approvals",
                        permissions: ["sales.read"],
                    },
                     {
                        label: "Configuration",
                        labelKey: "approvalConfig",
                        icon: Settings,
                        href: "/sales/approvals/config",
                        permissions: ["sales.approve", "sales.update"],
                    },
                ]
            },
            {
                label: "Purchase",
                labelKey: "purchase",
                icon: CreditCard,
                href: "/purchase",
            },
        ],
    },
    {
        label: "Organization",
        labelKey: "organization",
        icon: Building,
        children: [
            {
                label: "People",
                labelKey: "people",
                icon: User,
                href: "/people",
                permissions: [
                    "people.read",
                    "people.create",
                    "people.update",
                    "people.delete",
                ],
                routePermissions: [
                    "people.read",
                    "people.create",
                    "people.update",
                    "people.delete",
                ],
            },
            {
                label: "Departments",
                labelKey: "departments",
                icon: Network,
                href: "/departments",
                permissions: [
                    "departments.read",
                    "departments.create",
                    "departments.update",
                    "departments.delete",
                ],
                routePermissions: ["departments.read"],
            },
        ],
    },
    {
        label: "Administration",
        labelKey: "administration",
        icon: Settings,
        children: [
            {
                label: "Users",
                labelKey: "users",
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
            {
                label: "Roles",
                labelKey: "roles",
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
                label: "Tags",
                labelKey: "tags",
                icon: Tag,
                href: "/settings/tags",
                superAdminOnly: true,
            },
            {
                label: "Audit Logs",
                labelKey: "auditLogs",
                icon: History,
                href: "/settings/audit-logs",
                superAdminOnly: true,
            },
            {
                label: "Taxes",
                labelKey: "taxes",
                icon: Percent,
                href: "/settings/taxes",
                superAdminOnly: true,
            },
            {
                label: "Tenants",
                labelKey: "tenants",
                icon: Building2,
                href: "/settings/tenants",
                superAdminOnly: true,
            },
            {
                label: "Tenant",
                labelKey: "tenant",
                icon: Building,
                href: "/settings/tenant",
                permissions: ["settings.tenant.read", "settings.tenant.update"],
                routePermissions: ["settings.tenant.read", "settings.tenant.update"],
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
