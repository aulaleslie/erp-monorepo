"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LogOut, Building, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { salesApprovalsService } from "@/services/sales-approvals";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function Navbar() {
    const { user, activeTenant, refreshAuth } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [checkingTenants, setCheckingTenants] = useState(false);
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
    const t = useTranslations("navbar");

    useEffect(() => {
        if (!user || !activeTenant) return;

        const fetchCount = async () => {
            try {
                const { count } = await salesApprovalsService.getMyPendingCount();
                setPendingApprovalsCount(count);
            } catch (error) {
                console.error("Failed to fetch pending approvals count", error);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 60000); // Poll every minute

        return () => clearInterval(interval);
    }, [user, activeTenant]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            // Force a hard reload to clear any client-side state
            window.location.href = '/login';
        } catch (e) {
            console.error("Logout failed", e);
            // Even if api call fails, redirect to login
            window.location.href = '/login';
        }
    };

    const handleSelectTenantClick = async () => {
        setCheckingTenants(true);
        try {
            // Fetch latest tenants to check if any new ones were assigned
            const res = await fetch(`${API_URL}/me/tenants`, {
                credentials: "include",
            });

            if (res.ok) {
                const responseData = await res.json();
                const tenants = responseData.data || [];

                if (tenants.length === 0) {
                    // No tenants available - show notification
                    toast({
                        title: t('noWorkspacesTitle'),
                        description: t('noWorkspacesDescription'),
                        variant: "destructive",
                    });
                } else {
                    // Has tenants - refresh auth and navigate to select-tenant
                    await refreshAuth();
                    router.push(`/select-tenant?redirect=${encodeURIComponent(pathname)}`);
                }
            } else {
                toast({
                    title: t('workspaceErrorTitle'),
                    description: t('workspaceErrorDescription'),
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to check tenants", error);
            toast({
                title: t('workspaceErrorTitle'),
                description: t('workspaceErrorDescription'),
                variant: "destructive",
            });
        } finally {
            setCheckingTenants(false);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
            <div className="flex flex-1 items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectTenantClick}
                    disabled={checkingTenants}
                >
                    {checkingTenants ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Building className="mr-2 h-4 w-4" />
                    )}
                    {activeTenant?.name || t('selectWorkspaceButton')}
                </Button>
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {pendingApprovalsCount > 0 && (
                                <Badge
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                                    variant="destructive"
                                >
                                    {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {pendingApprovalsCount > 0 ? (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link href="/sales/orders/approvals" className="flex justify-between items-center w-full">
                                        <span>{t('pendingOrders')}</span>
                                        <Badge variant="secondary">{pendingApprovalsCount}</Badge>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/sales/invoices/approvals" className="flex justify-between items-center w-full">
                                        <span>{t('pendingInvoices')}</span>
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {t('noNotifications')}
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                                <AvatarFallback>{user?.fullName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>{t('profile')}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('logout')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
