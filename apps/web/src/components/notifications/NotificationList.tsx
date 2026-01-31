"use client";

import { useEffect, useState } from "react";
import { Notification } from "@gym-monorepo/shared";
import { notificationsService } from "@/services/notifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationListProps {
    onClose?: () => void;
    onRefreshCount?: () => void;
}

export function NotificationList({ onClose, onRefreshCount }: NotificationListProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("notifications");
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationsService.getNotifications({ limit: 5, page: 1 });
            setNotifications(data.items);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleNotificationClick = async (n: Notification) => {
        if (!n.isRead) {
            try {
                await notificationsService.markAsRead(n.id);
                onRefreshCount?.();
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }

        onClose?.();

        if (n.referenceType === 'member' && n.referenceId) {
            router.push(`/members/${n.referenceId}`);
        } else if (n.referenceType === 'membership' && n.referenceId) {
            // Assuming it's a membership-related notification, navigate to member detail
            // or specific membership page if it exists. For now, let's assume detail.
            router.push(`/members/detail/${n.referenceId}`);
        } else {
            router.push('/notifications');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            onRefreshCount?.();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-80 max-h-[500px]">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">{t('title')}</h3>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={handleMarkAllRead}>
                    {t('markAllRead')}
                </Button>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
                {notifications.length > 0 ? (
                    <div className="divide-y">
                        {notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onClick={handleNotificationClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 p-4 text-center gap-2">
                        <p className="text-sm text-muted-foreground">{t('noNotifications')}</p>
                    </div>
                )}
            </ScrollArea>
            <div className="p-2 border-t mt-auto">
                <Button asChild variant="ghost" size="sm" className="w-full text-xs" onClick={onClose}>
                    <Link href="/notifications">
                        {t('viewAll')}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
