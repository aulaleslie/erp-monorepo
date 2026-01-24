import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SalesTaxPricingMode } from '@gym-monorepo/shared';

export class SalesOrderItemDto {
  @ApiProperty({ description: 'Item ID from catalog' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount percent (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Line description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSalesOrderDto {
  @ApiProperty({ description: 'Document date (ISO 8601)' })
  @IsISO8601()
  documentDate: string;

  @ApiProperty({ description: 'Delivery date (ISO 8601)' })
  @IsISO8601()
  deliveryDate: string;

  @ApiProperty({ description: 'Customer ID (Person)' })
  @IsUUID()
  personId: string;

  @ApiPropertyOptional({ description: 'Salesperson ID (Person)' })
  @IsOptional()
  @IsUUID()
  salespersonPersonId?: string;

  @ApiPropertyOptional({ description: 'External reference' })
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiProperty({
    enum: SalesTaxPricingMode,
    default: SalesTaxPricingMode.INCLUSIVE,
  })
  @IsEnum(SalesTaxPricingMode)
  taxPricingMode: SalesTaxPricingMode = SalesTaxPricingMode.INCLUSIVE;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];

  @ApiPropertyOptional({ description: 'Billing address snapshot' })
  @IsOptional()
  @IsString()
  billingAddressSnapshot?: string;

  @ApiPropertyOptional({ description: 'Shipping address snapshot' })
  @IsOptional()
  @IsString()
  shippingAddressSnapshot?: string;
}
