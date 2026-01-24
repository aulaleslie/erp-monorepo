import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { DocumentStatus, SalesTaxPricingMode } from '@gym-monorepo/shared';

export interface SalesInvoiceLineItem {
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

export interface SalesInvoiceHeader {
  dueDate: string | null;
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

export interface SalesInvoiceListItem {
  id: string;
  number: string;
  documentDate: string;
  status: DocumentStatus;
  total: number;
  currencyCode: string;
  personId: string | null;
  personName: string | null;
  salesHeader?: SalesInvoiceHeader | null;
}

export interface SalesInvoiceDetail extends SalesInvoiceListItem {
  notes: string | null;
  items: SalesInvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoiceLinePayload {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  description?: string;
}

export interface SalesInvoiceCreatePayload {
  documentDate: string;
  dueDate: string;
  personId: string;
  salespersonPersonId?: string;
  externalRef?: string;
  paymentTerms?: string;
  taxPricingMode: SalesTaxPricingMode;
  notes?: string;
  items: SalesInvoiceLinePayload[];
  billingAddressSnapshot?: string;
  shippingAddressSnapshot?: string;
}

export type SalesInvoiceUpdatePayload = Partial<SalesInvoiceCreatePayload> & {
  items?: SalesInvoiceLinePayload[];
};

export interface SalesInvoiceListParams {
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

const BASE_URL = '/sales/invoices';

export const salesInvoicesService = {
  async list(params: SalesInvoiceListParams) {
    const response = await api.get<PaginatedResponse<SalesInvoiceListItem>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  async get(id: string) {
    const response = await api.get<SalesInvoiceDetail>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(payload: SalesInvoiceCreatePayload) {
    const response = await api.post<SalesInvoiceDetail>(BASE_URL, payload);
    return response.data;
  },

  async update(id: string, payload: SalesInvoiceUpdatePayload) {
    const response = await api.put<SalesInvoiceDetail>(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  async submit(id: string) {
    const response = await api.post<SalesInvoiceDetail>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  async approve(id: string, notes?: string) {
    const response = await api.post<SalesInvoiceDetail>(`${BASE_URL}/${id}/approve`, {
      notes,
    });
    return response.data;
  },

  async reject(id: string, reason: string) {
    const response = await api.post<SalesInvoiceDetail>(`${BASE_URL}/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  async requestRevision(id: string, reason: string) {
    const response = await api.post<SalesInvoiceDetail>(`${BASE_URL}/${id}/request-revision`, {
      reason,
    });
    return response.data;
  },

  async cancel(id: string, reason?: string) {
    const response = await api.post<SalesInvoiceDetail>(`${BASE_URL}/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  async post(id: string) {
    const response = await api.post<SalesInvoiceDetail>(`${BASE_URL}/${id}/post`);
    return response.data;
  },
};
