export enum NotificationType {
    MEMBERSHIP_EXPIRING = 'MEMBERSHIP_EXPIRING',
    PT_EXPIRING = 'PT_EXPIRING',
    BOOKING_REMINDER = 'BOOKING_REMINDER',
}

export interface Notification {
    id: string;
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceType?: string;
    referenceId?: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}
