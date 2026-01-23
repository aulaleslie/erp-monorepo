import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  resetPagination: () => void;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  total: initialTotal = 0,
}: UsePaginationProps = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setTotal(initialTotal);
  }, [initialPage, initialLimit, initialTotal]);

  return useMemo(() => ({
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setTotal,
    resetPagination,
  }), [page, limit, total, totalPages, resetPagination]);
}
