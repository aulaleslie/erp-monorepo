import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import {
  ItemListItem,
  CreateItemData,
  UpdateItemData,
  ItemType,
  ItemServiceKind,
  ItemStatus,
  ItemDurationUnit,
} from '@gym-monorepo/shared';

export type {
  ItemListItem,
  CreateItemData,
  UpdateItemData,
};

export {
  ItemType,
  ItemServiceKind,
  ItemStatus,
  ItemDurationUnit,
};

export interface ItemListParams {
  page: number;
  limit: number;
  search?: string;
  type?: ItemType | '';
  serviceKind?: ItemServiceKind | '';
  categoryId?: string;
  status?: ItemStatus | '';
}

export const itemsService = {
  async list(params: ItemListParams) {
    const query: Record<string, unknown> = {
      page: params.page,
      limit: params.limit,
    };

    if (params.search) {
      query.search = params.search;
    }
    if (params.type) {
      query.type = params.type;
    }
    if (params.serviceKind) {
      query.serviceKind = params.serviceKind;
    }
    if (params.categoryId) {
      query.categoryId = params.categoryId;
    }
    if (params.status) {
      query.status = params.status;
    }

    const response = await api.get<PaginatedResponse<ItemListItem>>(
      '/catalog/items',
      { params: query }
    );

    return response.data;
  },

  async get(id: string) {
    const response = await api.get<ItemListItem>(`/catalog/items/${id}`);
    return response.data;
  },

  async create(data: CreateItemData) {
    const response = await api.post<ItemListItem>('/catalog/items', data);
    return response.data;
  },

  async update(id: string, data: UpdateItemData) {
    const response = await api.put<ItemListItem>(`/catalog/items/${id}`, data);
    return response.data;
  },

  async remove(id: string) {
    await api.delete(`/catalog/items/${id}`);
  },

  async getActive() {
    const response = await api.get<PaginatedResponse<ItemListItem>>(
      '/catalog/items',
      { params: { status: ItemStatus.ACTIVE, limit: 100 } }
    );

    return response.data.items;
  },

  async uploadImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ItemListItem>(
      `/catalog/items/${id}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async importItems(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/catalog/items/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async exportItems(params: { format: 'csv' | 'xlsx'; fields?: string[]; search?: string; type?: string; status?: string; categoryId?: string }) {
    const response = await api.get('/catalog/items/export', {
      params,
      responseType: 'blob',
    });

    // The interceptor might not unwrap blobs, so we handle it here
    // If it's a blob, it's already what we want.
    return response.data;
  },
};
