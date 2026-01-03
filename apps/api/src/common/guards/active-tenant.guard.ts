import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { TENANT_ERRORS } from '@gym-monorepo/shared';

@Injectable()
export class ActiveTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const tenantId = request.cookies['active_tenant'];

    if (!tenantId) {
      throw new BadRequestException(
        TENANT_ERRORS.ACTIVE_TENANT_REQUIRED.message,
      );
    }

    // Attach to request for easier access
    (request as any).tenantId = tenantId;

    return true;
  }
}
