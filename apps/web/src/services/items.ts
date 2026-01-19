import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';

export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum ItemServiceKind {
  MEMBERSHIP = 'MEMBERSHIP',
  PT_SESSION = 'PT_SESSION',
}

export enum ItemDurationUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface CategorySummary {
  id: string;
  code: string;
  name: string;
}

export interface ItemListItem {
  id: string;
  code: string;
  name: string;
  type: ItemType;
  serviceKind: ItemServiceKind | null;
  price: number;
  status: ItemStatus;
  categoryId: string | null;
  category: CategorySummary | null;
  barcode: string | null;
  unit: string | null;
  tags: string[];
  description: string | null;
  durationValue: number | null;
  durationUnit: ItemDurationUnit | null;
  sessionCount: number | null;
  includedPtSessions: number | null;
  imageKey: string | null;
  imageUrl: string | null;
  imageMimeType: string | null;
  imageSize: number | null;
}

interface ItemListParams {
  page: number;
  limit: number;
  search?: string;
  type?: ItemType | '';
  serviceKind?: ItemServiceKind | '';
  categoryId?: string;
  status?: ItemStatus | '';
}

export interface CreateItemData {
  name: string;
  type: ItemType;
  price: number;
  categoryId?: string;
  serviceKind?: ItemServiceKind;
  barcode?: string;
  unit?: string;
  tags?: string[];
  description?: string;
  durationValue?: number;
  durationUnit?: ItemDurationUnit;
  sessionCount?: number;
  includedPtSessions?: number;
}

export interface UpdateItemData {
  name?: string;
  type?: ItemType;
  price?: number;
  categoryId?: string | null;
  serviceKind?: ItemServiceKind | null;
  barcode?: string | null;
  unit?: string | null;
  tags?: string[];
  description?: string | null;
  durationValue?: number | null;
  durationUnit?: ItemDurationUnit | null;
  sessionCount?: number | null;
  includedPtSessions?: number | null;
  status?: ItemStatus;
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
};
