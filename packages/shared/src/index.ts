export type HealthResponse = {
  status: string;
};

export interface BaseResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
