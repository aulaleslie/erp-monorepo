import { TaxType } from '../../../../database/entities/tax.entity';

export class TenantTaxSettingItemDto {
  id: string;
  name: string;
  code: string;
  rate: number;
  amount: number;
  type: TaxType;
  isSelected: boolean;
  isDefault: boolean;
}

export class TenantTaxSettingsResponseDto {
  isTaxable: boolean;
  taxes: TenantTaxSettingItemDto[];
}
