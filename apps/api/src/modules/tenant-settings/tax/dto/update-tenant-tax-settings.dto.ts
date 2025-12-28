import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateTenantTaxSettingsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taxIds: string[];

  @IsOptional()
  @IsUUID('4')
  defaultTaxId?: string;
}
