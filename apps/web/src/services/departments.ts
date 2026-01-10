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

export const departmentsService = {
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
