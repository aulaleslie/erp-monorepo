import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '@gym-monorepo/shared';

export class UpdateBookingDto {
  @IsDateString()
  @IsOptional()
  bookingDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}
