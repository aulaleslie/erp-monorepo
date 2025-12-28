import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to extract the current tenant ID from the request
 * The tenant ID is set by ActiveTenantGuard from the active_tenant cookie
 *
 * @example
 * @UseGuards(ActiveTenantGuard)
 * async getRoles(@CurrentTenant() tenantId: string) { }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
