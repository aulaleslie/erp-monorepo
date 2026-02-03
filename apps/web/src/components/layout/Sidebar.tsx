"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronDown, Menu } from "lucide-react";
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
import { sidebarConfig, type SidebarItem } from "@/components/layout/sidebar-config";
import { useTranslations } from "next-intl";

interface SidebarGroupProps {
    item: SidebarItem;
    isCollapsed: boolean;
    pathname: string;
    isItemVisible: (item: SidebarItem) => boolean;
    renderLeafItem: (item: SidebarItem) => React.ReactNode;
    getLabel: (item: SidebarItem) => string;
}

function SidebarGroup({
    item,
    isCollapsed,
    pathname,
    isItemVisible,
    renderLeafItem,
    getLabel,
}: SidebarGroupProps) {
    const visibleChildren = item.children?.filter(child => isItemVisible(child)) ?? [];
    const Icon = item.icon;
    const isActiveGroup = visibleChildren.some(child => child.href === pathname);
    const [isOpen, setIsOpen] = React.useState(isActiveGroup);

    React.useEffect(() => {
        if (isActiveGroup) {
            setIsOpen(true);
        }
    }, [isActiveGroup]);

    if (visibleChildren.length === 0) return null;

    if (isCollapsed) {
        return (
            <div className="flex flex-col gap-1">
                {visibleChildren.map(child => renderLeafItem(child))}
            </div>
        );
    }

    const label = getLabel(item);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                        isActiveGroup
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                    </span>
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 space-y-1 border-l border-border/60 pl-2">
                {visibleChildren.map(child => renderLeafItem(child))}
            </CollapsibleContent>
        </Collapsible>
    );
}

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const pathname = usePathname();
    const { canAny, isSuperAdmin } = usePermissions();
    const t = useTranslations("sidebar");
    const getLabel = (item: SidebarItem) => {
        if (item.labelKey) {
            try {
                return t(item.labelKey);
            } catch (e) {
                return item.label ?? item.labelKey;
            }
        }
        return item.label ?? "";
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        // Ideally persist to localStorage here
    };

    const isItemVisible = (item: SidebarItem): boolean => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (item.permissions && !canAny(item.permissions)) return false;
        if (item.children) {
            return item.children.some(child => isItemVisible(child));
        }
        return true;
    };

    const renderLeafItem = (item: SidebarItem) => {
        if (!isItemVisible(item)) return null;

        const isActive = item.href ? pathname === item.href : false;
        const Icon = item.icon;
        const label = getLabel(item);

        return (
            <TooltipProvider key={item.href || label}>
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
                            {!isCollapsed && <span>{label}</span>}
                        </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right">
                            {label}
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    };

    const renderItem = (item: SidebarItem) => {
        if (item.children && item.children.length > 0) {
            return (
                <SidebarGroup
                    key={item.label}
                    item={item}
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    isItemVisible={isItemVisible}
                    renderLeafItem={renderLeafItem}
                    getLabel={getLabel}
                />
            );
        }
        return renderLeafItem(item);
    };

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-card transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-14 items-center border-b px-3 justify-between">
                {!isCollapsed && <span className="font-bold text-lg px-2">{t('appName')}</span>}
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
