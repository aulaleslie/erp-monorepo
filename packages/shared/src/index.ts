// ============================================================================
// Re-exports from organized modules
// ============================================================================

import { AuditAction } from './types/audit';

export * from './constants';
export * from './types';

// ============================================================================
// Core Types
// ============================================================================

export type HealthResponse = {
  status: string;
};

export interface BaseResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  group: string;
}

// ============================================================================
// Tenant Types
// ============================================================================

export enum TenantType {
  GYM = 'GYM',
  EATERY = 'EATERY',
  COMPUTER_STORE = 'COMPUTER_STORE',
  GROCERY = 'GROCERY',
}

export const TENANT_TYPE_OPTIONS = [
  { value: TenantType.GYM, slug: 'gym', label: 'Gym' },
  { value: TenantType.EATERY, slug: 'eatery', label: 'Eatery' },
  { value: TenantType.COMPUTER_STORE, slug: 'computer-store', label: 'Computer Store' },
  { value: TenantType.GROCERY, slug: 'grocery', label: 'Grocery' },
] as const;

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  entityName: string;
  entityId: string;
  action: AuditAction;
  performedBy: string | null;
  timestamp: string;
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  performedByUser?: {
    id: string;
    fullName: string;
  } | null;
}
