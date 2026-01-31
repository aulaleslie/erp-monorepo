"use client";

import { Notification, NotificationType } from "@gym-monorepo/shared";
import { formatDistanceToNow } from "date-fns";
import { Bell, Calendar, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
    notification: Notification;
    onClick?: (notification: Notification) => void;
}

const getIcon = (type: NotificationType) => {
    switch (type) {
        case NotificationType.MEMBERSHIP_EXPIRING:
            return <User className="h-4 w-4" />;
        case NotificationType.PT_EXPIRING:
            return <CreditCard className="h-4 w-4" />;
        case NotificationType.BOOKING_REMINDER:
            return <Calendar className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
    const timeLabel = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    return (
        <div
            className={cn(
                "flex gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                !notification.isRead && "bg-muted/20"
            )}
            onClick={() => onClick?.(notification)}
        >
            <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background",
                !notification.isRead && "border-primary"
            )}>
                {getIcon(notification.type)}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
                <p className={cn(
                    "text-sm font-medium leading-none",
                    !notification.isRead && "text-primary"
                )}>
                    {notification.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-[10px] text-muted-foreground">
                    {timeLabel}
                </p>
            </div>
            {!notification.isRead && (
                <div className="ml-auto flex h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
        </div>
    );
}
