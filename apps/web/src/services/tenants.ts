import { api } from '@/lib/api';
import { TenantType } from '@gym-monorepo/shared';
import { PaginatedResponse } from './types';

export type TenantStatus = 'ACTIVE' | 'DISABLED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  type: TenantType;
  isTaxable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  type: TenantType;
  isTaxable?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  type?: TenantType;
  isTaxable?: boolean;
}

export const tenantsService = {
  getAll: async (page = 1, limit = 10, status?: TenantStatus) => {
    const response = await api.get<PaginatedResponse<Tenant>>('/tenants', {
      params: { page, limit, status },
    });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<Tenant>(`/tenants/${id}`);
    return response.data;
  },

  create: async (data: CreateTenantDto) => {
    const response = await api.post<Tenant>('/tenants', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTenantDto) => {
    const response = await api.put<Tenant>(`/tenants/${id}`, data);
    return response.data;
  },

  archive: async (id: string) => {
    await api.delete(`/tenants/${id}`);
  },
};
