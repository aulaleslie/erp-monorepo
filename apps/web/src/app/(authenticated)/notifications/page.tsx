"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Notification } from "@gym-monorepo/shared";
import { notificationsService } from "@/services/notifications";
import { usePagination } from "@/hooks/use-pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Loader2, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function NotificationsPage() {
    const t = useTranslations("notifications");
    const router = useRouter();
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const pagination = usePagination({
        initialLimit: 20,
    });

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await notificationsService.getNotifications({
                unreadOnly,
                page: pagination.page,
                limit: pagination.limit,
            });
            setNotifications(data.items);
            pagination.setTotal(data.total);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    }, [unreadOnly, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            // Optionally refresh unread count if we had a global state for it
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleNotificationClick = async (n: Notification) => {
        if (!n.isRead) {
            try {
                await notificationsService.markAsRead(n.id);
                setNotifications(notifications.map(prev =>
                    prev.id === n.id ? { ...prev, isRead: true } : prev
                ));
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }

        if (n.referenceType === 'member' && n.referenceId) {
            router.push(`/members/${n.referenceId}`);
        } else if (n.referenceType === 'membership' && n.referenceId) {
            router.push(`/members/${n.referenceId}`);
        }
    };

    const handleUnreadToggle = (checked: boolean) => {
        setUnreadOnly(checked);
        pagination.setPage(1);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title={t("title")}
                description={t("history")}
            >
                <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={loading || notifications.length === 0}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    {t("markAllRead")}
                </Button>
            </PageHeader>

            <div className="flex items-center space-x-2 py-2">
                <Checkbox
                    id="unread-only"
                    checked={unreadOnly}
                    onCheckedChange={(checked) => handleUnreadToggle(!!checked)}
                />
                <Label htmlFor="unread-only" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t("unread")}
                </Label>
            </div>

            <Card className="divide-y">
                {loading ? (
                    <div className="flex h-48 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length > 0 ? (
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
            </Card>

            {pagination.totalPages > 1 && (
                <div className="flex justify-center pt-4">
                    <PaginationControls
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.setPage}
                        loading={loading}
                    />
                </div>
            )}
        </div>
    );
}
