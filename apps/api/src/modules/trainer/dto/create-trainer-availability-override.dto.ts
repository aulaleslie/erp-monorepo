import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OverrideType } from '@gym-monorepo/shared';

export class CreateTrainerAvailabilityOverrideDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(OverrideType)
  @IsNotEmpty()
  overrideType: OverrideType;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
