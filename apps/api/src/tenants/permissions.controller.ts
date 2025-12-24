import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../users/decorators/require-permissions.decorator';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('roles.read')
  async findAll() {
    // Return all permissions so the UI can populate the checkbox list for Role creation/editing
    return this.permissionsService.findAll();
  }
}
