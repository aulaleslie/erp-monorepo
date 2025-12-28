import { api } from '../api';

export type TaxType = 'PERCENTAGE' | 'FIXED';
export type TaxStatus = 'ACTIVE' | 'INACTIVE';

export interface PlatformTax {
  id: string;
  code?: string;
  name: string;
  type: TaxType;
  rate?: number;
  amount?: number;
  status: TaxStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GetTaxesParams {
  search?: string;
  status?: TaxStatus;
  page?: number;
  limit?: number;
}

export interface GetTaxesResponse {
  data: PlatformTax[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getPlatformTaxes = async (params: GetTaxesParams) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  return api.get<GetTaxesResponse>(`/platform/taxes?${queryParams.toString()}`);
};
