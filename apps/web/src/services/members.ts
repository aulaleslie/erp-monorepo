import { api } from '@/lib/api';

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

export const MembersService = {
    lookup: async (query: string): Promise<MemberLookupResult[]> => {
        const { data } = await api.get('/members/lookup', { params: { q: query } });
        return data;
    },

    findOne: async (id: string) => {
        const { data } = await api.get(`/members/${id}`);
        return data;
    },
};
