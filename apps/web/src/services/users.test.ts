import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService, profileService } from './users';
import { api } from '@/lib/api';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches paginated tenant users with default params', async () => {
      const mockResponse = {
        items: [{ tenantId: 't1', userId: 'u1', roleId: 'r1' }],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/tenant-users', {
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('fetches paginated tenant users with custom params', async () => {
      mockApi.get.mockResolvedValue({ data: { items: [] } });

      await usersService.getAll(2, 15);

      expect(mockApi.get).toHaveBeenCalledWith('/tenant-users', {
        params: { page: 2, limit: 15 },
      });
    });
  });

  describe('getOne', () => {
    it('fetches a single tenant user by userId', async () => {
      const mockUser = { tenantId: 't1', userId: 'u1', roleId: 'r1' };
      mockApi.get.mockResolvedValue({ data: mockUser });

      const result = await usersService.getOne('u1');

      expect(mockApi.get).toHaveBeenCalledWith('/tenant-users/u1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('creates a new user', async () => {
      const newUser = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { tenantId: 't1', userId: 'u1' };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await usersService.create(newUser);

      expect(mockApi.post).toHaveBeenCalledWith('/tenant-users', newUser);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateUser', () => {
    it('updates a user', async () => {
      const updateData = { fullName: 'Updated Name' };
      const mockResponse = { userId: 'u1', fullName: 'Updated Name' };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await usersService.updateUser('u1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/tenant-users/u1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRole', () => {
    it('updates user role', async () => {
      mockApi.put.mockResolvedValue({});

      await usersService.updateRole('u1', 'r2');

      expect(mockApi.put).toHaveBeenCalledWith('/tenant-users/u1/role', { roleId: 'r2' });
    });

    it('removes user role when roleId is null', async () => {
      mockApi.put.mockResolvedValue({});

      await usersService.updateRole('u1', null);

      expect(mockApi.put).toHaveBeenCalledWith('/tenant-users/u1/role', { roleId: null });
    });
  });

  describe('remove', () => {
    it('removes a user from tenant', async () => {
      mockApi.delete.mockResolvedValue({});

      await usersService.remove('u1');

      expect(mockApi.delete).toHaveBeenCalledWith('/tenant-users/u1');
    });
  });

  describe('inviteExisting', () => {
    it('invites an existing user to tenant', async () => {
      const inviteData = { userId: 'u2', roleId: 'r1' };
      const mockResponse = { tenantId: 't1', userId: 'u2', roleId: 'r1' };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await usersService.inviteExisting(inviteData);

      expect(mockApi.post).toHaveBeenCalledWith('/tenant-users/invite', inviteData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getInvitableUsers', () => {
    it('fetches invitable users with search params', async () => {
      const params = { search: 'john', page: 1, limit: 10 };
      const mockResponse = {
        items: [{ id: 'u1', email: 'john@example.com' }],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getInvitableUsers(params);

      expect(mockApi.get).toHaveBeenCalledWith('/tenant-users/invitable', { params });
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateFullName', () => {
    it('updates user full name', async () => {
      const mockResponse = { id: 'u1', email: 'test@example.com', fullName: 'New Name' };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await profileService.updateFullName('New Name');

      expect(mockApi.patch).toHaveBeenCalledWith('/me/profile', { fullName: 'New Name' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePassword', () => {
    it('updates user password', async () => {
      mockApi.patch.mockResolvedValue({});

      await profileService.updatePassword('oldPass', 'newPass', 'newPass');

      expect(mockApi.patch).toHaveBeenCalledWith('/me/password', {
        currentPassword: 'oldPass',
        newPassword: 'newPass',
        confirmPassword: 'newPass',
      });
    });
  });

  describe('getMyTenants', () => {
    it('fetches user tenants', async () => {
      const mockTenants = [
        {
          tenant: { id: 't1', name: 'Tenant 1', slug: 'tenant-1' },
          role: { id: 'r1', name: 'Admin', isSuperAdmin: false },
        },
      ];
      mockApi.get.mockResolvedValue({ data: mockTenants });

      const result = await profileService.getMyTenants();

      expect(mockApi.get).toHaveBeenCalledWith('/me/tenants');
      expect(result).toEqual(mockTenants);
    });

    it('normalizes tenant list responses', async () => {
      const tenantList = [{ id: 't1', name: 'Tenant 1', slug: 'tenant-1' }];
      mockApi.get.mockResolvedValue({ data: tenantList });

      const result = await profileService.getMyTenants();

      expect(result).toEqual([
        {
          tenant: { id: 't1', name: 'Tenant 1', slug: 'tenant-1' },
          role: null,
        },
      ]);
    });
  });
});
