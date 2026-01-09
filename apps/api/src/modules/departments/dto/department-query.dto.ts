import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DepartmentStatus } from '@gym-monorepo/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class DepartmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DepartmentStatus)
  status: DepartmentStatus = DepartmentStatus.ACTIVE;
}
