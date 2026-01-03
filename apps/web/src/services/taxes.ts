import { api } from '@/lib/api';
import { PaginatedResponse } from './types';

export enum TaxType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum TaxStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Tax {
  id: string;
  code?: string;
  name: string;
  type: TaxType;
  rate?: number; // 0-1
  amount?: number;
  status: TaxStatus;
  tenantUsageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxDto {
  code?: string;
  name: string;
  type: TaxType;
  rate?: number;
  amount?: number;
}

export interface UpdateTaxDto {
  code?: string;
  name?: string;
  type?: TaxType;
  rate?: number;
  amount?: number;
  status?: TaxStatus;
}

export const taxesService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: TaxStatus }) => {
    const response = await api.get<PaginatedResponse<Tax>>('/platform/taxes', { params });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<Tax>(`/platform/taxes/${id}`);
    return response.data;
  },

  create: async (data: CreateTaxDto) => {
    const response = await api.post<Tax>('/platform/taxes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTaxDto) => {
    const response = await api.put<Tax>(`/platform/taxes/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    // Soft delete via DELETE verb as per API spec
    await api.delete(`/platform/taxes/${id}`);
  },
};
