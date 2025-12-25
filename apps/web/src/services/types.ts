/**
 * Shared types for frontend services
 */

/**
 * Generic paginated response structure
 * Matches the backend PaginatedResponse format
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
