import { api } from '@/lib/api';

export const salesPdfService = {
  async getUrl(documentId: string, force = false) {
    const response = await api.get<{ url: string }>(`/sales/documents/${documentId}/pdf`, {
      params: force ? { force: 'true' } : undefined,
    });
    return response.data.url;
  },

  async regenerate(documentId: string) {
    const response = await api.post<{ url: string }>(`/sales/documents/${documentId}/pdf`);
    return response.data.url;
  },
};
