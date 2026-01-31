"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationsService } from "@/services/notifications";
import { NotificationList } from "./NotificationList";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationBell() {
    const { user, activeTenant } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!user || !activeTenant) return;
        try {
            const { count } = await notificationsService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    }, [user, activeTenant]);

    useEffect(() => {
        // Calling fetchUnreadCount in a timeout to avoid synchronous setState inside an effect
        const timeoutId = setTimeout(() => {
            fetchUnreadCount();
        }, 0);

        const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, [fetchUnreadCount]);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                            variant="destructive"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0 border-none shadow-lg">
                <NotificationList
                    onClose={() => setIsOpen(false)}
                    onRefreshCount={fetchUnreadCount}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
