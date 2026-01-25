import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipStatus } from '@gym-monorepo/shared';

export class MembershipQueryDto {
  @IsUUID()
  @IsOptional()
  memberId?: string;

  @IsEnum(MembershipStatus)
  @IsOptional()
  status?: MembershipStatus;

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
