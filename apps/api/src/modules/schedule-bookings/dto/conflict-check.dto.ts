import { ConflictType } from '@gym-monorepo/shared';

export interface ConflictDetail {
  type: ConflictType;
  message: string;
  conflictingBookingId?: string;
  conflictingTimeSlot?: { startTime: string; endTime: string };
  trainerName?: string;
}
