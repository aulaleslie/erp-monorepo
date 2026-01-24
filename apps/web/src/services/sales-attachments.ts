import { api } from '@/lib/api';

export interface SalesAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey?: string;
  publicUrl: string;
  createdAt: string;
}

export const salesAttachmentsService = {
  async list(documentId: string) {
    const response = await api.get<SalesAttachment[]>(`/sales/documents/${documentId}/attachments`);
    return response.data;
  },

  async upload(documentId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<SalesAttachment>(
      `/sales/documents/${documentId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async remove(documentId: string, attachmentId: string) {
    await api.delete(`/sales/documents/${documentId}/attachments/${attachmentId}`);
  },
};
