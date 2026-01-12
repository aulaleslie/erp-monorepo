import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CategoryStatus } from '../../../../database/entities/category.entity';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class CategoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
