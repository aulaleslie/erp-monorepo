import { api } from '@/lib/api';
import { AuditLog, PaginatedResponse } from '@gym-monorepo/shared';

export const auditLogsService = {
  getAll: async (page = 1, limit = 10, filters?: {
    entityName?: string;
    performedBy?: string;
  }) => {
    const response = await api.get<PaginatedResponse<AuditLog>>(
      '/audit-logs',
      { params: { page, limit, ...filters } }
    );
    return response.data;
  },
};
