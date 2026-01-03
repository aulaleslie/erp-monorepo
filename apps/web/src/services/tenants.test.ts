import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantsService } from './tenants';
import { api } from '@/lib/api';
import { TenantType } from '@gym-monorepo/shared';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('tenantsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches paginated tenants with default params', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            name: 'Tenant A',
            slug: 'tenant-a',
            status: 'ACTIVE',
            type: TenantType.GYM,
            isTaxable: false,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      const result = await tenantsService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/tenants', {
        params: { page: 1, limit: 10, status: undefined },
      });
      expect(result).toEqual(mockResponse);
    });

    it('fetches paginated tenants with custom params', async () => {
      mockApi.get.mockResolvedValue({ data: { items: [] } });

      await tenantsService.getAll(3, 25);

      expect(mockApi.get).toHaveBeenCalledWith('/tenants', {
        params: { page: 3, limit: 25, status: undefined },
      });
    });
  });

  describe('getOne', () => {
    it('fetches a single tenant by id', async () => {
      const mockTenant = {
        id: '1',
        name: 'Tenant A',
        slug: 'tenant-a',
        status: 'ACTIVE',
        type: TenantType.GYM,
        isTaxable: false,
      };
      mockApi.get.mockResolvedValue({ data: mockTenant });

      const result = await tenantsService.getOne('1');

      expect(mockApi.get).toHaveBeenCalledWith('/tenants/1');
      expect(result).toEqual(mockTenant);
    });
  });

  describe('create', () => {
    it('creates a new tenant', async () => {
      const newTenant = { name: 'New Tenant', slug: 'new-tenant', type: TenantType.GYM };
      const mockResponse = { id: '2', ...newTenant, status: 'ACTIVE' };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await tenantsService.create(newTenant);

      expect(mockApi.post).toHaveBeenCalledWith('/tenants', newTenant);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('updates an existing tenant', async () => {
      const updateData = { name: 'Updated Tenant' };
      const mockResponse = { id: '1', name: 'Updated Tenant', slug: 'tenant-a' };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await tenantsService.update('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/tenants/1', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('updates tenant status', async () => {
      const updateData = { status: 'DISABLED' as const };
      mockApi.put.mockResolvedValue({ data: { id: '1', status: 'DISABLED' } });

      await tenantsService.update('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/tenants/1', updateData);
    });
  });

  describe('archive', () => {
    it('archives a tenant', async () => {
      mockApi.delete.mockResolvedValue({});

      await tenantsService.archive('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/tenants/1');
    });
  });
});
