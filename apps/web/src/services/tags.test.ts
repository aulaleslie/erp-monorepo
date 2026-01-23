import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tagsService } from './tags';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('tagsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('suggest', () => {
    it('calls GET /tags with query parameter', async () => {
      const mockData = [{ id: '1', name: 'tag1', usageCount: 5, lastUsedAt: null }];
      vi.mocked(api.get).mockResolvedValue({ data: mockData } as never);

      const result = await tagsService.suggest('test');

      expect(api.get).toHaveBeenCalledWith('/tags', { params: { query: 'test' } });
      expect(result).toEqual(mockData);
    });

    it('calls GET /tags without query parameter when not provided', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] } as never);

      await tagsService.suggest();

      expect(api.get).toHaveBeenCalledWith('/tags', { params: {} });
    });
  });

  describe('assign', () => {
    it('calls POST /tags/assign with correct body', async () => {
      const params = { resourceType: 'document', resourceId: '123', tags: ['a', 'b'] };
      const mockResult = { assigned: [] };
      vi.mocked(api.post).mockResolvedValue({ data: mockResult } as never);

      const result = await tagsService.assign(params);

      expect(api.post).toHaveBeenCalledWith('/tags/assign', params);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('calls DELETE /tags/assign with data in config', async () => {
      const params = { resourceType: 'document', resourceId: '123', tags: ['a'] };
      const mockResult = { removed: [] };
      vi.mocked(api.delete).mockResolvedValue({ data: mockResult } as never);

      const result = await tagsService.remove(params);

      expect(api.delete).toHaveBeenCalledWith('/tags/assign', { data: params });
      expect(result).toEqual(mockResult);
    });
  });
});
