import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions, useMe, useActiveTenant } from './use-permissions';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('useMe', () => {
  it('returns user from auth context', () => {
    const mockUser = { id: '1', email: 'test@example.com', fullName: 'Test User' };
    mockUseAuth.mockReturnValue({ user: mockUser });

    const { result } = renderHook(() => useMe());

    expect(result.current).toEqual(mockUser);
  });

  it('returns undefined when no user', () => {
    mockUseAuth.mockReturnValue({ user: undefined });

    const { result } = renderHook(() => useMe());

    expect(result.current).toBeUndefined();
  });
});

describe('useActiveTenant', () => {
  it('returns active tenant from auth context', () => {
    const mockTenant = { id: 't1', name: 'Test Tenant', slug: 'test' };
    mockUseAuth.mockReturnValue({ activeTenant: mockTenant });

    const { result } = renderHook(() => useActiveTenant());

    expect(result.current).toEqual(mockTenant);
  });

  it('returns undefined when no active tenant', () => {
    mockUseAuth.mockReturnValue({ activeTenant: undefined });

    const { result } = renderHook(() => useActiveTenant());

    expect(result.current).toBeUndefined();
  });
});

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSuperAdmin', () => {
    it('returns true when user.isSuperAdmin is true', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: true },
        permissions: { superAdmin: false, permissions: [] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('returns true when permissions.superAdmin is true', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: { superAdmin: true, permissions: [] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('returns false when neither is true', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: { superAdmin: false, permissions: [] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isSuperAdmin).toBe(false);
    });
  });

  describe('can', () => {
    it('returns true for any permission when super admin', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: true },
        permissions: { superAdmin: false, permissions: [] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('users.create')).toBe(true);
      expect(result.current.can('any.permission')).toBe(true);
    });

    it('returns true when user has the permission', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: { superAdmin: false, permissions: ['users.create', 'users.read'] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('users.create')).toBe(true);
    });

    it('returns false when user does not have the permission', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: { superAdmin: false, permissions: ['users.read'] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('users.create')).toBe(false);
    });

    it('returns false when permissions is undefined', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: undefined,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('users.create')).toBe(false);
    });
  });

  describe('canAny', () => {
    it('returns true for any permissions when super admin', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: true },
        permissions: { superAdmin: false, permissions: [] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAny(['users.create', 'roles.create'])).toBe(true);
    });

    it('returns true when user has at least one permission', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: { superAdmin: false, permissions: ['users.read'] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAny(['users.create', 'users.read'])).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: { superAdmin: false, permissions: ['roles.read'] },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAny(['users.create', 'users.read'])).toBe(false);
    });

    it('returns false when permissions is undefined', () => {
      mockUseAuth.mockReturnValue({
        user: { isSuperAdmin: false },
        permissions: undefined,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAny(['users.create'])).toBe(false);
    });
  });
});
