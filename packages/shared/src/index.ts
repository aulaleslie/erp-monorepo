export type HealthResponse = {
  status: string;
};

export interface BaseResponse<T = any> {
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

export interface AuditLog {
  id: string;
  entityName: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_REMOVE';
  performedBy: string | null;
  timestamp: string;
  previousValues: any;
  newValues: any;
  performedByUser?: {
    id: string;
    fullName: string;
  } | null;
}
