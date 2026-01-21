import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { TaxType } from '../../../database/entities/tax.entity';

export class CreateTaxDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(TaxType)
  @IsOptional()
  type?: TaxType = TaxType.PERCENTAGE;

  @ValidateIf((o: CreateTaxDto) => o.type === TaxType.PERCENTAGE || !o.type)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  rate?: number;

  @ValidateIf((o: CreateTaxDto) => o.type === TaxType.FIXED)
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}
