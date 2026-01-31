import { api } from '@/lib/api';
import type { Membership, PaginatedResponse } from '@gym-monorepo/shared';

export interface MembershipQueryFilters {
    memberId?: string;
    status?: string;
    page?: number;
    limit?: number;
    expiresAfter?: Date | string;
    expiresBefore?: Date | string;
}

export const MembershipsService = {
    findAll: async (params: MembershipQueryFilters): Promise<PaginatedResponse<Membership>> => {
        const { data } = await api.get('/memberships', { params });
        return data;
    },

    findOne: async (id: string): Promise<Membership> => {
        const { data } = await api.get(`/memberships/${id}`);
        return data;
    },

    cancel: async (id: string): Promise<Membership> => {
        const { data } = await api.post(`/memberships/${id}/cancel`);
        return data;
    },
};
