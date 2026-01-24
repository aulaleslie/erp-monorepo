import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { ApprovalStatus } from '@gym-monorepo/shared';

export interface SalesApprovalLevelRole {
  id: string;
  salesApprovalLevelId: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
  };
}

export interface SalesApprovalLevel {
  id: string;
  documentKey: string;
  levelIndex: number;
  isActive: boolean;
  roles: SalesApprovalLevelRole[];
}

export interface SalesApprovalConfig {
  documentKey: string;
  levels: Omit<SalesApprovalLevel, 'id' | 'roles'> & { roleIds: string[] }[];
}

export interface SalesApproval {
  id: string;
  documentId: string;
  levelIndex: number;
  status: ApprovalStatus;
  requestedByUserId: string;
  decidedByUserId?: string;
  decidedAt?: string;
  notes?: string;
  requestedByUser?: {
    fullName: string;
  };
  decidedByUser?: {
    fullName: string;
  };
}

export interface PendingApprovalListItem {
  id: string; // document id
  number: string;
  documentDate: string;
  total: number;
  currencyCode: string;
  personName: string;
  currentLevel: number;
  status: string;
}

const BASE_URL = '/sales/approvals';

export const salesApprovalsService = {
  async getConfig(documentKey: string) {
    const response = await api.get<SalesApprovalLevel[]>(`${BASE_URL}/config`, {
      params: { documentKey },
    });
    return response.data;
  },

  async updateConfig(documentKey: string, levels: { levelIndex: number; roleIds: string[] }[]) {
    const response = await api.put(`${BASE_URL}/config`, {
      documentKey,
      levels,
    });
    return response.data;
  },

  async getPendingOrders(params: { page: number; limit: number }) {
    const response = await api.get<PaginatedResponse<PendingApprovalListItem>>('/sales/orders/approvals', {
      params,
    });
    return response.data;
  },

  async getPendingInvoices(params: { page: number; limit: number }) {
    const response = await api.get<PaginatedResponse<PendingApprovalListItem>>('/sales/invoices/approvals', {
      params,
    });
    return response.data;
  },

  async action(documentType: 'orders' | 'invoices', documentId: string, action: 'approve' | 'reject' | 'request-revision', notes?: string) {
    const response = await api.post(`/sales/${documentType}/${documentId}/${action}`, {
      notes, // Adjust based on API (some might use 'reason' or 'notes')
      reason: notes, // Including both for compatibility
    });
    return response.data;
  },

  async getMyPendingCount() {
    const response = await api.get<{ count: number }>(`${BASE_URL}/pending-count`);
    return response.data;
  },
};
