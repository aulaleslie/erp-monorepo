import type { FastifyRequest } from 'fastify';
import type { JwtPayload } from '../decorators/current-user.decorator';

export type RequestWithUser = FastifyRequest & { user?: JwtPayload };
export type RequestWithTenant = FastifyRequest & { tenantId?: string };
export type RequestWithTenantUser = FastifyRequest & {
  user?: JwtPayload;
  tenantId?: string;
};
