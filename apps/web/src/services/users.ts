import { api } from '@/lib/api';

export interface TenantUser {
  tenantId: string;
  userId: string;
  roleId: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    status: string;
  } | null;
  role: {
    id: string;
    name: string;
    isSuperAdmin: boolean;
  } | null;
}

export interface CreateUserDto {
  email: string;
  fullName?: string;
  password: string;
  roleId?: string;
}

export interface InviteUserDto {
  userId: string;
  roleId: string;
}

export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  password?: string;
  roleId?: string | null;
}

export interface UserTenant {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    id: string;
    name: string;
    isSuperAdmin: boolean;
  };
}

export const usersService = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get<{ items: TenantUser[]; total: number; page: number; limit: number; totalPages: number }>(
      '/tenant-users',
      { params: { page, limit } }
    );
    return response.data;
  },

  getOne: async (userId: string) => {
    const response = await api.get<TenantUser>(`/tenant-users/${userId}`);
    return response.data;
  },

  create: async (data: CreateUserDto) => {
    const response = await api.post<TenantUser>('/tenant-users', data);
    return response.data;
  },

  updateUser: async (userId: string, data: UpdateUserDto) => {
    const response = await api.put<TenantUser>(`/tenant-users/${userId}`, data);
    return response.data;
  },

  updateRole: async (userId: string, roleId: string | null) => {
    await api.put(`/tenant-users/${userId}/role`, { roleId });
  },

  remove: async (userId: string) => {
    await api.delete(`/tenant-users/${userId}`);
  },

  inviteExisting: async (data: InviteUserDto) => {
    const response = await api.post<TenantUser>('/tenant-users/invite', data);
    return response.data;
  },

  getInvitableUsers: async (params: { search: string; page: number; limit: number }) => {
    const response = await api.get<{
      items: Array<{ id: string; email: string; fullName?: string }>;
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }>('/tenant-users/invitable', { params });
    return response.data;
  },
};

export const profileService = {
  updateFullName: async (fullName: string) => {
    const response = await api.patch<{
      id: string;
      email: string;
      fullName: string;
      isSuperAdmin: boolean;
    }>('/me/profile', { fullName });
    return response.data;
  },

  updatePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    await api.patch('/me/password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  getMyTenants: async () => {
    const response = await api.get<UserTenant[]>('/me/tenants');
    return response.data;
  },
};
