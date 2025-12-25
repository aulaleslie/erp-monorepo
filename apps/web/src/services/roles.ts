import { api } from '@/lib/api';
import { PaginatedResponse } from './types';

export interface Role {
  id: string;
  name: string;
  isSuperAdmin: boolean;
  tenantId: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: string[];
}

export interface RoleUser {
  id: string;
  email: string;
  fullName: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  group: string;
}

export const rolesService = {
  getAllPermissions: async () => {
    const response = await api.get<Permission[]>('/permissions');
    return response.data;
  },

  getAll: async (page = 1, limit = 10) => {
    const response = await api.get<PaginatedResponse<Role>>('/roles', {
      params: { page, limit },
    });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  create: async (data: CreateRoleDto) => {
    const response = await api.post<Role>('/roles', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRoleDto) => {
    const response = await api.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/roles/${id}`);
  },

  getAssignedUsers: async (id: string) => {
    const response = await api.get<RoleUser[]>(`/roles/${id}/users`);
    return response.data;
  }
};
