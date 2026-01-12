import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateItemDto } from './create-item.dto';
import { ItemStatus } from '../../../../database/entities/item.entity';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}
