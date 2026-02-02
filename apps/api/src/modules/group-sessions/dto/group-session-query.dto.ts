import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { GroupSessionStatus } from '@gym-monorepo/shared';

export class GroupSessionQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsOptional()
  @IsEnum(GroupSessionStatus)
  status?: GroupSessionStatus;
}
