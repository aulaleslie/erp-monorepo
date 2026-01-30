export enum BookingType {
    PT_SESSION = 'PT_SESSION',
    GROUP_SESSION = 'GROUP_SESSION',
}

export enum BookingStatus {
    SCHEDULED = 'SCHEDULED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum ConflictType {
    TRAINER_DOUBLE_BOOKED = 'TRAINER_DOUBLE_BOOKED',
    OUTSIDE_AVAILABILITY = 'OUTSIDE_AVAILABILITY',
    BLOCKED_OVERRIDE = 'BLOCKED_OVERRIDE',
}

export interface ScheduleBooking {
    id: string;
    tenantId: string;
    bookingType: BookingType;
    memberId: string;
    trainerId: string;
    ptPackageId: string | null;
    groupSessionId: string | null;
    bookingDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: BookingStatus;
    notes: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelledReason: string | null;
    member?: {
        id: string;
        memberCode: string;
        person: {
            fullName: string;
        };
    };
    trainer?: {
        id: string;
        fullName: string;
    };
}

export interface CreateBookingDto {
    bookingType: BookingType;
    memberId: string;
    trainerId: string;
    ptPackageId?: string;
    groupSessionId?: string;
    bookingDate: string;
    startTime: string;
    durationMinutes: number;
    notes?: string;
}

export interface UpdateBookingDto {
    bookingDate?: string;
    startTime?: string;
    durationMinutes?: number;
    notes?: string;
    status?: BookingStatus;
}

export interface BookingFilter {
    trainerId?: string;
    memberId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: BookingStatus;
    type?: BookingType;
    page?: number;
    limit?: number;
}
