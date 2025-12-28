import { paginate, calculateSkip, PaginatedResponse } from './pagination.dto';

describe('Pagination Utilities', () => {
  describe('calculateSkip', () => {
    it('should return 0 for page 1', () => {
      expect(calculateSkip(1, 10)).toBe(0);
    });

    it('should return correct skip for page 2', () => {
      expect(calculateSkip(2, 10)).toBe(10);
    });

    it('should return correct skip for page 3 with limit 25', () => {
      expect(calculateSkip(3, 25)).toBe(50);
    });

    it('should handle edge case of limit 1', () => {
      expect(calculateSkip(5, 1)).toBe(4);
    });
  });

  describe('paginate', () => {
    it('should return correct structure for empty items', () => {
      const result = paginate([], 0, 1, 10);
      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should calculate totalPages correctly', () => {
      const result = paginate(['a', 'b', 'c'], 25, 1, 10);
      expect(result.totalPages).toBe(3); // 25 items / 10 per page = 3 pages
    });

    it('should handle exact division', () => {
      const result = paginate(['a', 'b'], 20, 1, 10);
      expect(result.totalPages).toBe(2);
    });

    it('should handle single page', () => {
      const result = paginate(['a', 'b', 'c'], 3, 1, 10);
      expect(result.totalPages).toBe(1);
    });

    it('should preserve page and limit in response', () => {
      const result = paginate(['item1'], 50, 3, 15);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
      expect(result.total).toBe(50);
    });

    it('should preserve items array', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = paginate(items, 10, 1, 10);
      expect(result.items).toBe(items);
      expect(result.items).toHaveLength(2);
    });
  });
});
