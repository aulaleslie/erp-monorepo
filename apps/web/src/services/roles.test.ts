import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rolesService } from './roles';
import { api } from '@/lib/api';

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

describe('rolesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPermissions', () => {
    it('fetches all permissions', async () => {
      const mockPermissions = [
        { id: '1', code: 'users.create', name: 'Create Users', group: 'Users' },
        { id: '2', code: 'users.read', name: 'Read Users', group: 'Users' },
      ];
      mockApi.get.mockResolvedValue({ data: mockPermissions });

      const result = await rolesService.getAllPermissions();

      expect(mockApi.get).toHaveBeenCalledWith('/permissions');
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('getAll', () => {
    it('fetches paginated roles with default params', async () => {
      const mockResponse = {
        items: [{ id: '1', name: 'Admin' }],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      const result = await rolesService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/roles', {
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('fetches paginated roles with custom params', async () => {
      const mockResponse = { items: [], total: 0, page: 2, limit: 20 };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      await rolesService.getAll(2, 20);

      expect(mockApi.get).toHaveBeenCalledWith('/roles', {
        params: { page: 2, limit: 20 },
      });
    });
  });

  describe('getOne', () => {
    it('fetches a single role by id', async () => {
      const mockRole = { id: '1', name: 'Admin', permissions: ['users.create'] };
      mockApi.get.mockResolvedValue({ data: mockRole });

      const result = await rolesService.getOne('1');

      expect(mockApi.get).toHaveBeenCalledWith('/roles/1');
      expect(result).toEqual(mockRole);
    });
  });

  describe('create', () => {
    it('creates a new role', async () => {
      const newRole = { name: 'Manager', permissions: ['users.read'] };
      const mockResponse = { id: '2', ...newRole };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await rolesService.create(newRole);

      expect(mockApi.post).toHaveBeenCalledWith('/roles', newRole);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('updates an existing role', async () => {
      const updateData = { name: 'Updated Admin' };
      const mockResponse = { id: '1', name: 'Updated Admin' };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await rolesService.update('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/roles/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('deletes a role', async () => {
      mockApi.delete.mockResolvedValue({});

      await rolesService.delete('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/roles/1');
    });
  });

  describe('getAssignedUsers', () => {
    it('fetches users assigned to a role', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', fullName: 'User One' },
        { id: '2', email: 'user2@test.com', fullName: 'User Two' },
      ];
      mockApi.get.mockResolvedValue({ data: mockUsers });

      const result = await rolesService.getAssignedUsers('1');

      expect(mockApi.get).toHaveBeenCalledWith('/roles/1/users');
      expect(result).toEqual(mockUsers);
    });
  });
});
