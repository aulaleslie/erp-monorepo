import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PtPackageStatus } from '@gym-monorepo/shared';

export class PtPackageQueryDto {
  @IsUUID()
  @IsOptional()
  memberId?: string;

  @IsUUID()
  @IsOptional()
  trainerId?: string;

  @IsEnum(PtPackageStatus)
  @IsOptional()
  status?: PtPackageStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
