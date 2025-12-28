import { api } from '../api';
import { PlatformTax } from './taxes';

export interface TenantTaxSettings {
  isTaxable: boolean;
  selectedTaxIds: string[];
  defaultTaxId: string | null;
  taxes?: PlatformTax[]; // Optional detailed objects for display
}

export interface UpdateTenantTaxSettingsDto {
  taxIds: string[];
  defaultTaxId?: string;
}

export const getTenantTaxSettings = async () => {
  return api.get<TenantTaxSettings>('/tenant-settings/tax');
};

export const updateTenantTaxSettings = async (data: UpdateTenantTaxSettingsDto) => {
  return api.put<TenantTaxSettings>('/tenant-settings/tax', data);
};
