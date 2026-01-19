import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface CategoryListItem {
  id: string;
  code: string;
  name: string;
  status: CategoryStatus;
  parentId: string | null;
  parent?: CategoryListItem | null;
  children?: CategoryListItem[];
}

interface CategoryListParams {
  page: number;
  limit: number;
  search?: string;
  status?: CategoryStatus | '';
  parentId?: string;
}

export interface CreateCategoryData {
  name: string;
  parentId?: string;
}

export interface UpdateCategoryData {
  name?: string;
  parentId?: string | null;
  status?: CategoryStatus;
}

export const categoriesService = {
  async list(params: CategoryListParams) {
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
    if (params.parentId) {
      query.parentId = params.parentId;
    }

    const response = await api.get<PaginatedResponse<CategoryListItem>>(
      '/catalog/categories',
      { params: query }
    );

    return response.data;
  },

  async get(id: string) {
    const response = await api.get<CategoryListItem>(`/catalog/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryData) {
    const response = await api.post<CategoryListItem>('/catalog/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryData) {
    const response = await api.put<CategoryListItem>(`/catalog/categories/${id}`, data);
    return response.data;
  },

  async remove(id: string) {
    await api.delete(`/catalog/categories/${id}`);
  },

  async getActive() {
    const response = await api.get<PaginatedResponse<CategoryListItem>>(
      '/catalog/categories',
      { params: { status: CategoryStatus.ACTIVE, limit: 100 } }
    );

    return response.data.items;
  },

  async getRoots() {
    const response = await api.get<PaginatedResponse<CategoryListItem>>(
      '/catalog/categories',
      { params: { status: CategoryStatus.ACTIVE, limit: 100 } }
    );

    // Filter to only root categories (no parent)
    return response.data.items.filter(cat => cat.parentId === null);
  },
};
