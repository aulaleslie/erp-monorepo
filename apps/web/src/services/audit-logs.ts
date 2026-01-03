import { api } from '@/lib/api';
import { AuditLog, AuditLogFilters, PaginatedResponse } from '@gym-monorepo/shared';

export const auditLogsService = {
  getAll: async (page = 1, limit = 10, filters?: AuditLogFilters) => {
    const response = await api.get<PaginatedResponse<AuditLog>>(
      '/audit-logs',
      { params: { page, limit, ...filters } }
    );
    return response.data;
  },
};
