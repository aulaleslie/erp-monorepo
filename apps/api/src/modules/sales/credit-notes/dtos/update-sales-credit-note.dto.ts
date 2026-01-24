import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SalesTaxPricingMode } from '@gym-monorepo/shared';

class ItemDto {
  @IsString()
  itemId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;
}

export class UpdateSalesCreditNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SalesTaxPricingMode)
  taxPricingMode?: SalesTaxPricingMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];
}
