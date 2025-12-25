/**
 * Pagination utilities for consistent paginated responses across services
 */

/**
 * Generic paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
