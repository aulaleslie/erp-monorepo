import { ActiveTenantGuard } from './active-tenant.guard';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import type { RequestWithTenant } from '../../../common/types/request';

describe('ActiveTenantGuard', () => {
  let guard: ActiveTenantGuard;

  beforeEach(() => {
    guard = new ActiveTenantGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if active_tenant cookie is present', () => {
      const mockRequest = {
        cookies: {
          active_tenant: 'tenant-1',
        },
      } as unknown as RequestWithTenant & { cookies: Record<string, string> };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRequest.tenantId).toBe('tenant-1');
    });

    it('should throw BadRequestException if active_tenant cookie is missing', () => {
      const mockRequest = {
        cookies: {},
      } as unknown as RequestWithTenant & { cookies: Record<string, string> };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(BadRequestException);
    });
  });
});
