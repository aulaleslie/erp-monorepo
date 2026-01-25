import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateMembershipDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
