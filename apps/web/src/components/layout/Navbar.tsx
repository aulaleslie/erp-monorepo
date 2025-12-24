"use client";

import Link from "next/link";
import { User, LogOut, Settings as SettingsIcon } from "lucide-react";
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

export function Navbar() {
    const { user, activeTenant } = useAuth();
    // We assume there's a way to logout. For cycle 1, we might just clear cookie or hit endpoint.
    // The context likely doesn't expose logout directly yet, or we use a basic fetch.
    // AuthContext shows no logout function, so we'll link to /auth/logout or implement it.

    // Actually AuthContext interface has `refreshAuth`.
    // Cycle 1 spec says POST /auth/logout.

    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' }); // Using nextjs proxy or direct API?
            // Assuming API is on localhost:3001 and we might need full URL or proxy.
            // For now, let's just redirect to /login which might clear things or we assume a page handler.
            // Docs say POST /auth/logout.

            // Let's assume we navigate to /login for now, or use a server action/api route wrapper.
            // We'll just hard refresh to /auth/logout if configured, but better to fetch and redirect.
            window.location.href = '/login';
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
            <div className="flex flex-1 items-center gap-4">
                {/* Tenant Selector Placeholder - In Cycle 1 we have /select-tenant page, 
            but sidebar allows switching? Docs say "Left side: Tenant dropdown".
            We'll implement a basic button linking to select-tenant or a dropdown later.
        */}
                <Button variant="outline" size="sm" asChild>
                    <Link href="/select-tenant">
                        {activeTenant?.name || "Select Tenant"}
                    </Link>
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
