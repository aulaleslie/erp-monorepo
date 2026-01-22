import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { TenantType, Locale } from '@gym-monorepo/shared';

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Slug cannot be empty' })
  slug?: string;

  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @IsOptional()
  @IsEnum(Locale, { message: 'Language must be one of the supported locales' })
  language?: Locale;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  taxIds?: string[];

  @IsOptional()
  @IsString({ message: 'Theme preset ID must be a string' })
  themePresetId?: string;

  @IsOptional()
  @IsInt({ message: 'Tag max length must be an integer' })
  @Min(1, { message: 'Tag max length must be at least 1' })
  tagMaxLength?: number | null;

  @IsOptional()
  @IsString()
  tagAllowedPattern?: string | null;
}
