import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DepartmentStatus } from '@gym-monorepo/shared';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(DepartmentStatus)
  status?: DepartmentStatus;
}
