export type HealthResponse = {
  status: string;
};

export interface BaseResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
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
