import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CalendarQueryDto {
  @IsString()
  @IsOptional()
  trainerIds?: string;

  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}
