import { AuditAction } from './audit';

export interface AuditLogFilters {
  entityName?: string;
  performedBy?: string;
  from?: string;
  to?: string;
  action?: AuditAction;
}
