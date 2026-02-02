import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTenantSchedulingSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bookingLeadTimeHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationWindowHours?: number;
}
