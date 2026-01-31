import { api } from '@/lib/api';
import type {
    GroupSession,
    CreateGroupSessionDto,
    UpdateGroupSessionDto,
    GroupSessionParticipant
} from '@gym-monorepo/shared';

export interface GroupSessionsListResponse {
    items: GroupSession[];
    total: number;
}

export const GroupSessionsService = {
    findAll: async (params: Record<string, unknown>): Promise<GroupSessionsListResponse> => {
        const { data } = await api.get('/group-sessions', { params });
        return data;
    },

    findOne: async (id: string): Promise<GroupSession> => {
        const { data } = await api.get(`/group-sessions/${id}`);
        return data;
    },

    create: async (payload: CreateGroupSessionDto): Promise<GroupSession> => {
        const { data } = await api.post('/group-sessions', payload);
        return data;
    },

    update: async (id: string, payload: UpdateGroupSessionDto): Promise<GroupSession> => {
        const { data } = await api.put(`/group-sessions/${id}`, payload);
        return data;
    },

    cancel: async (id: string): Promise<GroupSession> => {
        const { data } = await api.post(`/group-sessions/${id}/cancel`);
        return data;
    },

    getParticipants: async (id: string): Promise<GroupSessionParticipant[]> => {
        const { data } = await api.get(`/group-sessions/${id}/participants`);
        return data;
    },

    addParticipant: async (id: string, memberId: string): Promise<GroupSessionParticipant> => {
        const { data } = await api.post(`/group-sessions/${id}/participants`, { memberId });
        return data;
    },

    removeParticipant: async (sessionId: string, participantId: string): Promise<void> => {
        await api.delete(`/group-sessions/${sessionId}/participants/${participantId}`);
    },
};
