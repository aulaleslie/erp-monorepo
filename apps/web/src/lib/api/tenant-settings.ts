import { api } from '../api';
import { TenantType } from '@gym-monorepo/shared';
import { TaxType } from './taxes';

export interface TenantTaxSettingItem {
  id: string;
  name: string;
  code?: string;
  rate?: number;
  amount?: number;
  type: TaxType;
  isSelected: boolean;
  isDefault: boolean;
}

export interface TenantTaxSettings {
  isTaxable: boolean;
  selectedTaxIds: string[];
  defaultTaxId: string | null;
  taxes?: TenantTaxSettingItem[]; // Optional detailed objects for display
}

export interface TenantTaxMapping {
  id: string;
  taxId: string;
  isDefault: boolean;
}

export interface TenantProfileSettings {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DISABLED';
  type: TenantType;
  isTaxable: boolean;
  taxes?: TenantTaxMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantTaxSettingsDto {
  taxIds: string[];
  defaultTaxId?: string;
}

export interface UpdateTenantProfileSettingsDto {
  name?: string;
  slug?: string;
  type?: TenantType;
  isTaxable?: boolean;
  taxIds?: string[];
}

export const getTenantProfileSettings = async () => {
  return api.get<TenantProfileSettings>('/tenant-settings/tenant');
};

export const updateTenantProfileSettings = async (
  data: UpdateTenantProfileSettingsDto,
) => {
  return api.put<TenantProfileSettings>('/tenant-settings/tenant', data);
};

export const getTenantTaxSettings = async () => {
  return api.get<TenantTaxSettings>('/tenant-settings/tax');
};

export const updateTenantTaxSettings = async (data: UpdateTenantTaxSettingsDto) => {
  return api.put<TenantTaxSettings>('/tenant-settings/tax', data);
};
