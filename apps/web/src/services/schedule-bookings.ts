import { api } from '@/lib/api';
import type {
    ScheduleBooking,
    CreateBookingDto,
    UpdateBookingDto,
    BookingFilter
} from '@gym-monorepo/shared';

export interface BookingsListResponse {
    items: ScheduleBooking[];
    total: number;
}

export const ScheduleBookingsService = {
    findAll: async (filter: BookingFilter): Promise<BookingsListResponse> => {
        const { data } = await api.get('/bookings', { params: filter });
        return data;
    },

    findOne: async (id: string): Promise<ScheduleBooking> => {
        const { data } = await api.get(`/bookings/${id}`);
        return data;
    },

    create: async (payload: CreateBookingDto): Promise<ScheduleBooking> => {
        const { data } = await api.post('/bookings', payload);
        return data;
    },

    update: async (id: string, payload: UpdateBookingDto): Promise<ScheduleBooking> => {
        const { data } = await api.put(`/bookings/${id}`, payload);
        return data;
    },

    cancel: async (id: string, reason: string): Promise<ScheduleBooking> => {
        const { data } = await api.post(`/bookings/${id}/cancel`, { reason });
        return data;
    },

    complete: async (id: string): Promise<ScheduleBooking> => {
        const { data } = await api.post(`/bookings/${id}/complete`);
        return data;
    },

    noShow: async (id: string): Promise<ScheduleBooking> => {
        const { data } = await api.post(`/bookings/${id}/no-show`);
        return data;
    },

    getCalendar: async (params: { trainerId?: string; dateFrom: string; dateTo: string }): Promise<any> => {
        const { data } = await api.get('/bookings/calendar', { params });
        return data;
    }
};
