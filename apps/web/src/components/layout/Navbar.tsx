"use client";

import Link from "next/link";
import { useState } from "react";
import { User, LogOut, Building, Loader2 } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function Navbar() {
    const { user, activeTenant, hasTenants, refreshAuth } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [checkingTenants, setCheckingTenants] = useState(false);

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
            const res = await fetch(`${API_URL}/tenants/my`, {
                credentials: "include",
            });

            if (res.ok) {
                const responseData = await res.json();
                const tenants = responseData.data || [];

                if (tenants.length === 0) {
                    // No tenants available - show notification
                    toast({
                        title: "No workspaces available",
                        description: "You don't have access to any workspaces. Please contact your administrator.",
                        variant: "destructive",
                    });
                } else {
                    // Has tenants - refresh auth and navigate to select-tenant
                    await refreshAuth();
                    router.push("/select-tenant");
                }
            } else {
                toast({
                    title: "Error",
                    description: "Failed to check workspace availability.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to check tenants", error);
            toast({
                title: "Error",
                description: "Failed to check workspace availability.",
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
                    {activeTenant?.name || "Select Workspace"}
                </Button>
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/avatars/01.png" alt={user?.fullName || "User"} />
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
                            <Link href="/app/profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

