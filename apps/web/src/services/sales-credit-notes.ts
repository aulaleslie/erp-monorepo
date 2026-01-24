import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { DocumentStatus, SalesTaxPricingMode } from '@gym-monorepo/shared';

export interface SalesCreditNoteLineItem {
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

export interface SalesCreditNoteHeader {
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

export interface SalesCreditNoteListItem {
  id: string;
  number: string;
  documentDate: string;
  status: DocumentStatus;
  total: number;
  currencyCode: string;
  personId: string | null;
  personName: string | null;
  salesHeader?: SalesCreditNoteHeader | null;
}

export interface SalesCreditNoteDetail extends SalesCreditNoteListItem {
  notes: string | null;
  items: SalesCreditNoteLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesCreditNoteListParams {
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

const BASE_URL = '/sales/credit-notes';

export const salesCreditNotesService = {
  async list(params: SalesCreditNoteListParams) {
    const response = await api.get<PaginatedResponse<SalesCreditNoteListItem>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  async get(id: string) {
    const response = await api.get<SalesCreditNoteDetail>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createFromInvoice(invoiceId: string) {
    const response = await api.post<SalesCreditNoteDetail>(`/sales/invoices/${invoiceId}/credit-notes`);
    return response.data;
  },

  async submit(id: string) {
    const response = await api.post<SalesCreditNoteDetail>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  async approve(id: string, notes?: string) {
    const response = await api.post<SalesCreditNoteDetail>(`${BASE_URL}/${id}/approve`, {
      notes,
    });
    return response.data;
  },

  async reject(id: string, reason: string) {
    const response = await api.post<SalesCreditNoteDetail>(`${BASE_URL}/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  async requestRevision(id: string, reason: string) {
    const response = await api.post<SalesCreditNoteDetail>(`${BASE_URL}/${id}/request-revision`, {
      reason,
    });
    return response.data;
  },

  async cancel(id: string, reason?: string) {
    const response = await api.post<SalesCreditNoteDetail>(`${BASE_URL}/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  async post(id: string) {
    const response = await api.post<SalesCreditNoteDetail>(`${BASE_URL}/${id}/post`);
    return response.data;
  },
};
