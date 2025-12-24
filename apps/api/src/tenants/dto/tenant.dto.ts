import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  slug: string;
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
}
