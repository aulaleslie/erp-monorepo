import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './use-pagination';

describe('usePagination', () => {
  describe('initialization', () => {
    it('uses default values when no props provided', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(10);
      expect(result.current.total).toBe(0);
    });

    it('uses custom initial values', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 2, initialLimit: 20, total: 100 })
      );

      expect(result.current.page).toBe(2);
      expect(result.current.limit).toBe(20);
      expect(result.current.total).toBe(100);
    });

    it('accepts partial initial values', () => {
      const { result } = renderHook(() => usePagination({ initialLimit: 25 }));

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(25);
      expect(result.current.total).toBe(0);
    });
  });

  describe('totalPages calculation', () => {
    it('returns 1 when total is 0', () => {
      const { result } = renderHook(() => usePagination({ total: 0 }));
      expect(result.current.totalPages).toBe(1);
    });

    it('calculates exact division correctly', () => {
      const { result } = renderHook(() => usePagination({ total: 100, initialLimit: 10 }));
      expect(result.current.totalPages).toBe(10);
    });

    it('rounds up for remainder', () => {
      const { result } = renderHook(() => usePagination({ total: 25, initialLimit: 10 }));
      expect(result.current.totalPages).toBe(3);
    });

    it('returns 1 for items less than limit', () => {
      const { result } = renderHook(() => usePagination({ total: 5, initialLimit: 10 }));
      expect(result.current.totalPages).toBe(1);
    });

    it('recalculates when limit changes', () => {
      const { result } = renderHook(() => usePagination({ total: 100, initialLimit: 10 }));
      expect(result.current.totalPages).toBe(10);

      act(() => {
        result.current.setLimit(20);
      });
      expect(result.current.totalPages).toBe(5);
    });

    it('recalculates when total changes', () => {
      const { result } = renderHook(() => usePagination({ total: 50, initialLimit: 10 }));
      expect(result.current.totalPages).toBe(5);

      act(() => {
        result.current.setTotal(150);
      });
      expect(result.current.totalPages).toBe(15);
    });
  });

  describe('setPage', () => {
    it('updates page value', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);
    });
  });

  describe('setLimit', () => {
    it('updates limit value', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setLimit(50);
      });

      expect(result.current.limit).toBe(50);
    });
  });

  describe('setTotal', () => {
    it('updates total value', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setTotal(200);
      });

      expect(result.current.total).toBe(200);
    });
  });

  describe('resetPagination', () => {
    it('resets all values to initial state', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, initialLimit: 10, total: 50 })
      );

      // Change values
      act(() => {
        result.current.setPage(3);
        result.current.setLimit(25);
        result.current.setTotal(200);
      });

      expect(result.current.page).toBe(3);
      expect(result.current.limit).toBe(25);
      expect(result.current.total).toBe(200);

      // Reset
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(10);
      expect(result.current.total).toBe(50);
    });

    it('resets to default initial values when none provided', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setPage(5);
        result.current.setLimit(50);
        result.current.setTotal(500);
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(10);
      expect(result.current.total).toBe(0);
    });
  });
});
