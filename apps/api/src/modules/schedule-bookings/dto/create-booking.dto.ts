import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { BookingType } from '@gym-monorepo/shared';

export class CreateBookingDto {
  @IsEnum(BookingType)
  @IsNotEmpty()
  bookingType: BookingType;

  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsNotEmpty()
  trainerId: string;

  @IsUUID()
  @IsOptional()
  ptPackageId?: string;

  @IsUUID()
  @IsOptional()
  groupSessionId?: string;

  @IsDateString()
  @IsNotEmpty()
  bookingDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  durationMinutes: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
