import { api } from '@/lib/api';
import { AttendanceType, CheckInMethod } from '@gym-monorepo/shared';

export interface CheckInPayload {
    memberId?: string;
    memberCode?: string;
    memberPhone?: string;
    attendanceType: AttendanceType;
    bookingId?: string;
    checkInMethod?: CheckInMethod;
    notes?: string;
}

export interface AttendanceRecord {
    id: string;
    memberId: string;
    attendanceType: AttendanceType;
    checkInAt: string;
    checkOutAt: string | null;
    checkInMethod: CheckInMethod;
    notes: string | null;
    member: {
        id: string;
        memberCode: string;
        person: {
            fullName: string;
        };
    };
    checkedInByUser?: {
        fullName: string;
    };
}

export const AttendanceService = {
    checkIn: async (payload: CheckInPayload) => {
        const { data } = await api.post('/attendance/check-in', payload);
        return data;
    },

    checkOut: async (id: string) => {
        const { data } = await api.post(`/attendance/check-out/${id}`);
        return data;
    },

    findAll: async (params: Record<string, unknown>) => {
        const { data } = await api.get('/attendance', { params });
        return data;
    },

    getTodayCheckIns: async () => {
        const { data } = await api.get('/attendance/today');
        return data;
    },
};
