import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TenantType } from '@gym-monorepo/shared';

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
}
