import { api } from '@/lib/api';
import type {
    Member,
    CreateMemberDto,
    UpdateMemberDto,
    Membership,
    PtSessionPackage
} from '@gym-monorepo/shared';

export interface MemberLookupResult {
    id: string;
    memberCode: string;
    currentExpiryDate: string | null;
    status: string;
    person: {
        fullName: string;
        phone: string | null;
        email: string | null;
    };
}

export interface MembersListResponse {
    items: Member[];
    total: number;
}

export const MembersService = {
    findAll: async (params: Record<string, unknown>): Promise<MembersListResponse> => {
        const { data } = await api.get('/members', { params });
        return data;
    },

    findOne: async (id: string): Promise<Member> => {
        const { data } = await api.get(`/members/${id}`);
        return data;
    },

    create: async (payload: CreateMemberDto): Promise<Member> => {
        const { data } = await api.post('/members', payload);
        return data;
    },

    update: async (id: string, payload: UpdateMemberDto): Promise<Member> => {
        const { data } = await api.put(`/members/${id}`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/members/${id}`);
    },

    lookup: async (query: string): Promise<MemberLookupResult[]> => {
        const { data } = await api.get('/members/lookup', { params: { q: query } });
        return data;
    },

    getMemberships: async (id: string): Promise<Membership[]> => {
        const { data } = await api.get(`/members/${id}/memberships`);
        return data;
    },

    getPtPackages: async (id: string): Promise<PtSessionPackage[]> => {
        const { data } = await api.get(`/members/${id}/pt-packages`);
        return data;
    },

    getAttendance: async (id: string, params?: Record<string, unknown>): Promise<{ items: Record<string, unknown>[]; total: number }> => {
        const { data } = await api.get(`/attendance`, { params: { ...params, memberId: id } });
        return data;
    },

    getHistory: async (id: string): Promise<Record<string, unknown>[]> => {
        const { data } = await api.get(`/members/${id}/history`);
        return data;
    },
};
