import { TenantMembershipGuard } from './tenant-membership.guard';
import { TenantsService } from '../tenants.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('TenantMembershipGuard', () => {
  let guard: TenantMembershipGuard;
  let tenantsService: Partial<Record<keyof TenantsService, jest.Mock>>;

  beforeEach(async () => {
    tenantsService = {
      validateTenantAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMembershipGuard,
        {
          provide: TenantsService,
          useValue: tenantsService,
        },
      ],
    }).compile();

    guard = module.get<TenantMembershipGuard>(TenantMembershipGuard);
  });

  describe('canActivate', () => {
    it('should return false if no user', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return true if user is super admin', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { isSuperAdmin: true },
            tenantId: 'tenant-1',
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if no tenantId', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { isSuperAdmin: false }, tenantId: null }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return true if access is valid', async () => {
      tenantsService.validateTenantAccess!.mockResolvedValue(true);
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', isSuperAdmin: false },
            tenantId: 'tenant-1',
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if access is invalid', async () => {
      tenantsService.validateTenantAccess!.mockResolvedValue(false);
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', isSuperAdmin: false },
            tenantId: 'tenant-1',
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
