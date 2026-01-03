/**
 * Shared types for frontend services
 */

// Re-export pagination types from shared package
export type { PaginatedResponse } from '@gym-monorepo/shared';
export { PAGINATION_DEFAULTS } from '@gym-monorepo/shared';

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
