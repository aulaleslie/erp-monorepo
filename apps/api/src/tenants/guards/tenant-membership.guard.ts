import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { TenantsService } from '../tenants.service';

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private tenantsService: TenantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!user) {
      return false; // AuthGuard should have run
    }

    // ActiveTenantGuard should have set this or thrown bad request.
    // However, if ActiveTenantGuard was optional, we need to check.
    if (!tenantId) {
      // If no tenant is selected, we can't check membership. 
      // This guard implies a tenant context is required.
      throw new ForbiddenException('Tenant context required');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const hasAccess = await this.tenantsService.validateTenantAccess(
      user.id,
      tenantId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return true;
  }
}
