import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../users/decorators/require-permissions.decorator';
import { TenantUsersService } from './tenant-users.service';

@Controller('tenant-users')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TenantUsersController {
  constructor(private readonly tenantUsersService: TenantUsersService) {}

  @Get()
  @RequirePermissions('users.read')
  async findAll(@Req() req: any) {
    return this.tenantUsersService.findAll(req.tenantId);
  }

  @Post()
  @RequirePermissions('users.create')
  async create(
    @Req() req: any,
    @Body() body: { email: string; fullName?: string; roleId: string },
  ) {
    return this.tenantUsersService.create(req.tenantId, body);
  }

  @Put(':userId/role')
  @RequirePermissions('users.assignRole')
  async updateRole(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { roleId: string },
  ) {
    return this.tenantUsersService.updateRole(req.tenantId, userId, body.roleId);
  }
}
