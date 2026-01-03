import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  async findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.rolesService.findAll(req.tenantId, Number(page), Number(limit));
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const role = await this.rolesService.findOne(req.tenantId, id);
    // Fetch permissions for this role
    const permissions = await this.rolesService.getPermissionsForRole(role.id);
    return {
      ...role,
      permissions,
    };
  }

  @Get(':id/users')
  @RequirePermissions('roles.read')
  async getAssignedUsers(@Req() req: any, @Param('id') id: string) {
    return this.rolesService.getAssignedUsers(req.tenantId, id);
  }

  @Post()
  @RequirePermissions('roles.create')
  async create(
    @Req() req: any,
    @Body()
    body: { name: string; isSuperAdmin?: boolean; permissions?: string[] },
  ) {
    if (body.isSuperAdmin && !req.user?.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can create Super Admin roles');
    }
    if (
      (!body.permissions || body.permissions.length === 0) &&
      !body.isSuperAdmin
    ) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          permissions: ['At least one permission is required'],
        },
      });
    }

    const role = await this.rolesService.create(req.tenantId, {
      name: body.name,
      isSuperAdmin: body.isSuperAdmin,
    });

    if (body.permissions && body.permissions.length > 0) {
      await this.rolesService.assignPermissions(
        req.tenantId,
        role.id,
        body.permissions,
      );
    }

    return role;
  }

  @Put(':id')
  @RequirePermissions('roles.update')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; permissions?: string[] },
  ) {
    const role = await this.rolesService.update(req.tenantId, id, {
      name: body.name,
    });

    if (body.permissions) {
      await this.rolesService.assignPermissions(
        req.tenantId,
        role.id,
        body.permissions,
      );
    }

    return role;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('roles.delete')
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.rolesService.delete(req.tenantId, id);
  }
}
