import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { Notification } from '@gym-monorepo/shared';

const BASE_URL = '/notifications';

export const notificationsService = {
    async getNotifications(params: { unreadOnly?: boolean; page: number; limit: number }) {
        const response = await api.get<PaginatedResponse<Notification>>(BASE_URL, {
            params,
        });
        return response.data;
    },

    async getUnreadCount() {
        const response = await api.get<{ count: number }>(`${BASE_URL}/count`);
        return response.data;
    },

    async markAsRead(id: string) {
        const response = await api.post(`${BASE_URL}/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.post(`${BASE_URL}/read-all`);
        return response.data;
    },
};
