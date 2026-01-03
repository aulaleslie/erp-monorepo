import { api } from '../api';
import { TenantType } from '@gym-monorepo/shared';
import { PlatformTax } from './taxes';

export interface TenantTaxSettings {
  isTaxable: boolean;
  selectedTaxIds: string[];
  defaultTaxId: string | null;
  taxes?: PlatformTax[]; // Optional detailed objects for display
}

export interface TenantProfileSettings {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DISABLED';
  type: TenantType;
  isTaxable: boolean;
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
