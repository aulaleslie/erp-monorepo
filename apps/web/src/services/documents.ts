import { api } from '@/lib/api';
import { DocumentStatus } from '@gym-monorepo/shared';

export interface DocumentStatusHistoryEntry {
  id: string;
  documentId: string;
  fromStatus: DocumentStatus;
  toStatus: DocumentStatus;
  changedByUserId: string;
  reason: string | null;
  changedAt: string;
  changedByUser?: {
    id: string;
    fullName?: string | null;
  } | null;
}

export const documentsService = {
  async getStatusHistory(documentId: string) {
    const response = await api.get<DocumentStatusHistoryEntry[]>(`/documents/${documentId}/history`);
    return response.data;
  },
};
