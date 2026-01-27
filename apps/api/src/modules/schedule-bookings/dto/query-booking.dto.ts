import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsString,
} from 'class-validator';
import { BookingStatus, BookingType } from '@gym-monorepo/shared';

export class QueryBookingDto {
  @IsUUID()
  @IsOptional()
  trainerId?: string;

  @IsUUID()
  @IsOptional()
  memberId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsEnum(BookingType)
  @IsOptional()
  type?: BookingType;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
