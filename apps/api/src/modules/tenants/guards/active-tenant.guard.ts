import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import type { RequestWithTenant } from '../../../common/types/request';

@Injectable()
export class ActiveTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenant & { cookies: Record<string, string> }>();
    const tenantId = request.cookies['active_tenant'];

    if (!tenantId) {
      throw new BadRequestException('Active tenant is required');
    }

    // Attach to request for easier access
    request.tenantId = tenantId;

    return true;
  }
}
