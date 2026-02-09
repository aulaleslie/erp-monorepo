export enum OverrideType {
  BLOCKED = 'BLOCKED',
  MODIFIED = 'MODIFIED',
}

export interface TrainerAvailability {
  id: string;
  tenantId: string;
  trainerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface TrainerAvailabilityOverride {
  id: string;
  tenantId: string;
  trainerId: string;
  date: string;
  overrideType: OverrideType;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface UpdateTrainerAvailabilityDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface CreateTrainerAvailabilityOverrideDto {
  date: string;
  overrideType: OverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}
