import { PermissionGuard } from './permission.guard';
import { UsersService } from '../users.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let reflector: Partial<Record<keyof Reflector, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      getPermissions: jest.fn(),
    };
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
  });

  describe('canActivate', () => {
    it('should return true if no permissions required', async () => {
      reflector.getAllAndOverride!.mockReturnValue(null);
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return false if no user', async () => {
      reflector.getAllAndOverride!.mockReturnValue(['perm-1']);
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return true if user is super admin', async () => {
      reflector.getAllAndOverride!.mockReturnValue(['perm-1']);
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { isSuperAdmin: true } }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return true if user has resolved super admin', async () => {
      reflector.getAllAndOverride!.mockReturnValue(['perm-1']);
      usersService.getPermissions!.mockResolvedValue({ superAdmin: true });
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', isSuperAdmin: false },
            tenantId: 'tenant-1',
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return true if user has required permissions', async () => {
      reflector.getAllAndOverride!.mockReturnValue(['perm-1', 'perm-2']);
      usersService.getPermissions!.mockResolvedValue({
        superAdmin: false,
        permissions: ['perm-1', 'perm-2', 'perm-3'],
      });
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', isSuperAdmin: false },
            tenantId: 'tenant-1',
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user misses permissions', async () => {
      reflector.getAllAndOverride!.mockReturnValue(['perm-1', 'perm-2']);
      usersService.getPermissions!.mockResolvedValue({
        superAdmin: false,
        permissions: ['perm-1'],
      });
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', isSuperAdmin: false },
            tenantId: 'tenant-1',
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
