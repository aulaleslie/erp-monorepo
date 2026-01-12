import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  ItemType,
  ItemServiceKind,
  ItemStatus,
} from '../../../../database/entities/item.entity';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ItemQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @IsOptional()
  @IsEnum(ItemServiceKind)
  serviceKind?: ItemServiceKind;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}
