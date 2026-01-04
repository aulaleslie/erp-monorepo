import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TenantType, Locale } from '@gym-monorepo/shared';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  slug: string;

  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsEnum(Locale, {
    message: 'Language must be one of the supported locales',
  })
  language?: Locale;

  @ValidateIf((obj: { isTaxable?: boolean }) => obj.isTaxable === true)
  @IsArray({ message: 'Tax selection is required for taxable tenants' })
  @ArrayNotEmpty({ message: 'Tax selection is required for taxable tenants' })
  @IsUUID('4', { each: true, message: 'Each tax must be a valid UUID' })
  taxIds?: string[];

  @IsOptional()
  @IsString({ message: 'Theme preset ID must be a string' })
  themePresetId?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Slug cannot be empty' })
  slug?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'DISABLED'])
  status?: 'ACTIVE' | 'DISABLED';

  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsEnum(Locale, {
    message: 'Language must be one of the supported locales',
  })
  language?: Locale;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  taxIds?: string[];

  @IsOptional()
  @IsString({ message: 'Theme preset ID must be a string' })
  themePresetId?: string;
}
