import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { TENANT_ERRORS } from '@gym-monorepo/shared';
import type { RequestWithTenant } from '../types/request';

@Injectable()
export class ActiveTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.cookies['active_tenant'];

    if (!tenantId) {
      throw new BadRequestException(
        TENANT_ERRORS.ACTIVE_TENANT_REQUIRED.message,
      );
    }

    // Attach to request for easier access
    request.tenantId = tenantId;

    return true;
  }
}
