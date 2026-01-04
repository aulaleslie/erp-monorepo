import { api } from '../api';
import { Locale, TenantType, ThemeVariant } from '@gym-monorepo/shared';
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

export interface TenantThemeMapping {
  id: string;
  tenantId: string;
  presetId: string;
  logoUrl?: string;
}

export interface TenantProfileSettings {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DISABLED';
  type: TenantType;
  isTaxable: boolean;
  taxes?: TenantTaxMapping[];
  theme?: TenantThemeMapping[];
  createdAt: string;
  updatedAt: string;
  language: Locale;
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
  themePresetId?: string;
  language?: Locale;
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

export interface TenantThemeSettings {
  presetId: string;
  colors: ThemeVariant;
  logoUrl?: string;
}

export interface UpdateTenantThemeSettingsDto {
  presetId: string;
  logoUrl?: string;
}

export const getTenantThemeSettings = async () => {
  return api.get<TenantThemeSettings>('/tenant-settings/theme');
};

export const updateTenantThemeSettings = async (
  data: UpdateTenantThemeSettingsDto,
) => {
  return api.put<void>('/tenant-settings/theme', data);
};
