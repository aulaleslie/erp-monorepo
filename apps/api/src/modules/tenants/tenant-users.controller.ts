import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantUsersService } from './tenant-users.service';
import { UsersService } from '../users/users.service';
import type { RequestWithTenantUser } from '../../common/types/request';

@ApiTags('users')
@ApiCookieAuth('access_token')
@Controller('tenant-users')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TenantUsersController {
  constructor(
    private readonly tenantUsersService: TenantUsersService,
    private readonly usersService: UsersService,
  ) {}

  @Get('invitable')
  @RequirePermissions('users.create')
  async getInvitableUsers(
    @Req() req: RequestWithTenantUser,
    @Query('search') search: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.searchInvitableUsers(
      req.tenantId!,
      search,
      Number(page),
      Number(limit),
    );
  }

  @Get()
  @RequirePermissions('users.read')
  async findAll(
    @Req() req: RequestWithTenantUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.tenantUsersService.findAll(
      req.tenantId!,
      Number(page),
      Number(limit),
      req.user?.isSuperAdmin === true,
    );
  }

  @Get(':userId')
  @RequirePermissions('users.read')
  async findOne(
    @Req() req: RequestWithTenantUser,
    @Param('userId') userId: string,
  ) {
    return this.tenantUsersService.findOne(req.tenantId!, userId);
  }

  @Post()
  @RequirePermissions('users.create')
  async create(
    @Req() req: RequestWithTenantUser,
    @Body()
    body: {
      email: string;
      fullName?: string;
      roleId?: string;
      password: string;
    },
  ) {
    return this.tenantUsersService.create(
      req.tenantId!,
      body,
      req.user?.isSuperAdmin === true,
    );
  }

  @Post('invite')
  @RequirePermissions('users.create')
  async inviteExisting(
    @Req() req: RequestWithTenantUser,
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.tenantUsersService.inviteExistingUser(
      req.tenantId!,
      body,
      req.user?.isSuperAdmin === true,
    );
  }

  @Put(':userId')
  @RequirePermissions('users.update')
  async updateUser(
    @Req() req: RequestWithTenantUser,
    @Param('userId') userId: string,
    @Body()
    body: {
      email?: string;
      fullName?: string;
      password?: string;
      roleId?: string | null;
    },
  ) {
    return this.tenantUsersService.updateUser(
      req.tenantId!,
      userId,
      body,
      req.user?.isSuperAdmin === true,
    );
  }

  @Put(':userId/role')
  @RequirePermissions('users.assignRole')
  async updateRole(
    @Req() req: RequestWithTenantUser,
    @Param('userId') userId: string,
    @Body() body: { roleId: string | null },
  ) {
    return this.tenantUsersService.updateRole(
      req.tenantId!,
      userId,
      body.roleId,
      req.user?.isSuperAdmin === true,
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users.delete')
  async remove(
    @Req() req: RequestWithTenantUser,
    @Param('userId') userId: string,
  ) {
    await this.tenantUsersService.remove(req.tenantId!, userId);
  }
}
