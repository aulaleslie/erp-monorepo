import { api } from '@/lib/api';
import type {
    TrainerAvailability,
    TrainerAvailabilityOverride,
    UpdateTrainerAvailabilityDto,
    CreateTrainerAvailabilityOverrideDto
} from '@gym-monorepo/shared';

export const TrainerAvailabilityService = {
    getAvailability: async (trainerId: string): Promise<TrainerAvailability[]> => {
        const { data } = await api.get('/trainer-availability', { params: { trainerId } });
        return data;
    },

    updateAvailability: async (trainerId: string, payload: UpdateTrainerAvailabilityDto): Promise<void> => {
        await api.put(`/trainer-availability/${trainerId}`, payload);
    },

    async getOverrides(trainerId: string, dateFrom: string, dateTo: string): Promise<TrainerAvailabilityOverride[]> {
        const { data } = await api.get(`/trainer-availability/${trainerId}/overrides`, {
            params: { dateFrom, dateTo }
        });
        return data;
    },

    async createOverride(trainerId: string, payload: CreateTrainerAvailabilityOverrideDto): Promise<TrainerAvailabilityOverride> {
        const { data } = await api.post(`/trainer-availability/${trainerId}/overrides`, payload);
        return data;
    },

    async deleteOverride(trainerId: string, overrideId: string): Promise<void> {
        await api.delete(`/trainer-availability/${trainerId}/overrides/${overrideId}`);
    },

    getSlots: async (trainerId: string, date: string): Promise<{ startTime: string; endTime: string }[]> => {
        const { data } = await api.get(`/trainer-availability/${trainerId}/slots`, { params: { date } });
        return data;
    }
};
