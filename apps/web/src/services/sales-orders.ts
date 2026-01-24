import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { DocumentStatus, SalesTaxPricingMode } from '@gym-monorepo/shared';

export interface SalesOrderLineItem {
  id: string;
  itemId: string;
  itemName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  discountPercent?: number;
  lineTotal: number;
  metadata?: Record<string, unknown> | null;
}

export interface SalesOrderHeader {
  deliveryDate: string | null;
  paymentTerms: string | null;
  externalRef: string | null;
  taxPricingMode: SalesTaxPricingMode;
  salespersonPersonId: string | null;
  salesperson?: {
    id: string;
    fullName: string;
  } | null;
  billingAddressSnapshot: string | null;
  shippingAddressSnapshot: string | null;
}

export interface SalesOrderListItem {
  id: string;
  number: string;
  documentDate: string;
  status: DocumentStatus;
  total: number;
  currencyCode: string;
  personId: string | null;
  personName: string | null;
  salesHeader?: SalesOrderHeader | null;
}

export interface SalesOrderDetail extends SalesOrderListItem {
  notes: string | null;
  items: SalesOrderLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderLinePayload {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  description?: string;
}

export interface SalesOrderCreatePayload {
  documentDate: string;
  deliveryDate: string;
  personId: string;
  salespersonPersonId?: string;
  externalRef?: string;
  paymentTerms?: string;
  taxPricingMode: SalesTaxPricingMode;
  notes?: string;
  items: SalesOrderLinePayload[];
  billingAddressSnapshot?: string;
  shippingAddressSnapshot?: string;
}

export type SalesOrderUpdatePayload = Partial<SalesOrderCreatePayload> & {
  items?: SalesOrderLinePayload[];
};

export interface SalesOrderListParams {
  page: number;
  limit: number;
  status?: DocumentStatus;
  personId?: string;
  number?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  tag?: string;
}

const BASE_URL = '/sales/orders';

export const salesOrdersService = {
  async list(params: SalesOrderListParams) {
    const response = await api.get<PaginatedResponse<SalesOrderListItem>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  async get(id: string) {
    const response = await api.get<SalesOrderDetail>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(payload: SalesOrderCreatePayload) {
    const response = await api.post<SalesOrderDetail>(BASE_URL, payload);
    return response.data;
  },

  async update(id: string, payload: SalesOrderUpdatePayload) {
    const response = await api.put<SalesOrderDetail>(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  async submit(id: string) {
    const response = await api.post<SalesOrderDetail>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  async approve(id: string, notes?: string) {
    const response = await api.post<SalesOrderDetail>(`${BASE_URL}/${id}/approve`, {
      notes,
    });
    return response.data;
  },

  async reject(id: string, reason: string) {
    const response = await api.post<SalesOrderDetail>(`${BASE_URL}/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  async requestRevision(id: string, reason: string) {
    const response = await api.post<SalesOrderDetail>(`${BASE_URL}/${id}/request-revision`, {
      reason,
    });
    return response.data;
  },

  async cancel(id: string, reason?: string) {
    const response = await api.post<SalesOrderDetail>(`${BASE_URL}/${id}/cancel`, {
      reason,
    });
    return response.data;
  },
};
