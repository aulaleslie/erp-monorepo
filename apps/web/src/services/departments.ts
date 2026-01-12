import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { DepartmentStatus } from '@gym-monorepo/shared';

export interface DepartmentListItem {
  id: string;
  code: string;
  name: string;
  status: DepartmentStatus;
}

interface DepartmentListParams {
  page: number;
  limit: number;
  search?: string;
  status?: DepartmentStatus | '';
}

export interface CreateDepartmentData {
  name: string;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentData {
  name?: string;
  status?: DepartmentStatus;
}

export const departmentsService = {
  async get(id: string) {
    const response = await api.get<DepartmentListItem>(`/departments/${id}`);
    return response.data;
  },

  async create(data: CreateDepartmentData) {
    const response = await api.post<DepartmentListItem>('/departments', data);
    return response.data;
  },

  async update(id: string, data: UpdateDepartmentData) {
    const response = await api.put<DepartmentListItem>(`/departments/${id}`, data);
    return response.data;
  },

  async remove(id: string) {
    await api.delete(`/departments/${id}`);
  },

  async list(params: DepartmentListParams) {
    const query: Record<string, unknown> = {
      page: params.page,
      limit: params.limit,
    };

    if (params.search) {
      query.search = params.search;
    }

    if (params.status) {
      query.status = params.status;
    }

    const response = await api.get<PaginatedResponse<DepartmentListItem>>(
      '/departments',
      { params: query }
    );

    return response.data;
  },

  async getActive() {
    const response = await api.get<PaginatedResponse<DepartmentListItem>>(
      '/departments',
      { params: { status: DepartmentStatus.ACTIVE, limit: 100 } }
    );

    return response.data.items;
  },
};
