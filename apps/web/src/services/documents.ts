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

export interface DocumentRelation {
  id: string;
  fromDocumentId: string;
  toDocumentId: string;
  relationType: string;
  metadata: any | null;
  fromDocument?: {
    id: string;
    number: string | null;
  } | null;
  toDocument?: {
    id: string;
    number: string | null;
  } | null;
}

export const documentsService = {
  async getStatusHistory(documentId: string) {
    const response = await api.get<DocumentStatusHistoryEntry[]>(`/documents/${documentId}/history`);
    return response.data;
  },

  async getRelations(documentId: string) {
    const response = await api.get<DocumentRelation[]>(`/documents/${documentId}/relations`);
    return response.data;
  },
};

