/**
 * Pagination utilities for consistent paginated responses across services
 */

import { PaginatedResponse, PAGINATION_DEFAULTS } from '@gym-monorepo/shared';

// Re-export from shared for backward compatibility
export { PaginatedResponse, PAGINATION_DEFAULTS };

/**
 * Create a paginated response object
 * @param items - Array of items for the current page
 * @param total - Total count of all items
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 */
export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Calculate skip value for database queries
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
