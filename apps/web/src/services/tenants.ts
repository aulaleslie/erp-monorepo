import { api } from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  status?: 'ACTIVE' | 'DISABLED';
}

export const tenantsService = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get<Tenant[] | { items: Tenant[]; total: number }>('/tenants', {
      params: { page, limit },
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

  disable: async (id: string) => {
    await api.delete(`/tenants/${id}`);
  }
};
