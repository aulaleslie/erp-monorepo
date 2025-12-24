"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Settings,
    Shield,
    Users,
    Building,
    ChevronLeft,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/use-permissions";

interface SidebarItem {
    label: string;
    icon: React.ElementType;
    href?: string;
    permissions?: string[];
    superAdminOnly?: boolean;
    children?: SidebarItem[];
    collapsed?: boolean; // internal use for structure, though config is usually static
}

const sidebarConfig: SidebarItem[] = [
    {
        label: 'Dashboard',
        icon: Home,
        href: '/app/dashboard',
    },
    {
        label: 'Settings',
        icon: Settings, // Placeholder icon for group
        children: [
            {
                label: 'Roles',
                icon: Shield,
                href: '/app/settings/roles',
                permissions: [
                    'roles.read',
                    'roles.create',
                    'roles.update',
                    'roles.delete',
                ],
            },
            {
                label: 'Users',
                icon: Users,
                href: '/app/settings/users',
                permissions: [
                    'users.read',
                    'users.create',
                    'users.update',
                    'users.assignRole',
                ],
            },
        ],
    },
    {
        label: 'Platform',
        icon: Building, // Placeholder
        superAdminOnly: true,
        children: [
            {
                label: 'Tenants',
                icon: Building,
                href: '/app/platform/tenants',
            },
        ],
    },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const pathname = usePathname();
    const { canAny, isSuperAdmin } = usePermissions();

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        // Ideally persist to localStorage here
    };

    const isItemVisible = (item: SidebarItem) => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (item.permissions && !canAny(item.permissions)) return false;
        if (item.children) {
            return item.children.some(child => isItemVisible(child));
        }
        return true;
    };

    const renderItem = (item: SidebarItem, level = 0) => {
        if (!isItemVisible(item)) return null;

        const isActive = item.href ? pathname === item.href : false;
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
            if (isCollapsed) {
                // When collapsed, we might want to show children in a popover or just hide the group header if it's purely structural
                // For now, let's just render the children's icon if top level, or skip if it's a structural group without href.
                // Actually, sidebarConfig has 'Settings' as a group.
                // In collapsed mode, groups usually just show children flat or in a menu.
                // Simplification: Render children directly if collapsed, or skip group header.
                return (
                    <div key={item.label} className="flex flex-col gap-1">
                        {!isCollapsed && (
                            <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">
                                {item.label}
                            </h4>
                        )}
                        {item.children?.map(child => renderItem(child, level))}
                    </div>
                );
            }

            return (
                <div key={item.label} className="space-y-1">
                    <h4 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                    </h4>
                    {item.children?.map(child => renderItem(child, level + 1))}
                </div>
            );
        }

        // Leaf node
        return (
            <TooltipProvider key={item.href || item.label}>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href || '#'}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right">
                            {item.label}
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-card transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-14 items-center border-b px-3 justify-between">
                {!isCollapsed && <span className="font-bold text-lg px-2">Gym ERP</span>}
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
                    {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-auto py-2 px-2 space-y-1">
                {sidebarConfig.map(item => renderItem(item))}
            </div>
        </div>
    );
}
