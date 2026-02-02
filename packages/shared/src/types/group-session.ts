export enum GroupSessionStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    EXHAUSTED = 'EXHAUSTED',
    CANCELLED = 'CANCELLED',
}

export interface GroupSession {
    id: string;
    tenantId: string;
    purchaserMemberId: string;
    itemId: string;
    itemName: string;
    sourceDocumentId: string | null;
    sourceDocumentItemId: string | null;
    instructorId: string | null;
    status: GroupSessionStatus;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    maxParticipants: number;
    startDate: string;
    expiryDate: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    // Relations
    purchaser?: {
        id: string;
        person: {
            fullName: string;
        };
    };
    instructor?: {
        id: string;
        fullName: string;
    };
    participantsCount?: number;
}

export interface GroupSessionParticipant {
    id: string;
    groupSessionId: string;
    memberId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    member?: {
        id: string;
        code: string;
        person: {
            fullName: string;
        };
    };
}

export interface CreateGroupSessionDto {
    purchaserMemberId: string;
    itemId: string;
    instructorId?: string;
    totalSessions: number;
    maxParticipants: number;
    startDate: string;
    expiryDate?: string;
    notes?: string;
}

export interface UpdateGroupSessionDto {
    instructorId?: string;
    notes?: string;
}

export interface GroupSessionListItem extends GroupSession {
    purchaserName: string;
    instructorName: string;
    activeParticipantsCount: number;
}
