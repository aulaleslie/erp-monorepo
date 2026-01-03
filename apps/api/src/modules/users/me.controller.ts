import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { TenantsService } from '../tenants/tenants.service';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('users')
@ApiCookieAuth('access_token')
@Controller('me')
@UseGuards(AuthGuard('jwt'))
export class MeController {
  constructor(
    private usersService: UsersService,
    @Inject(forwardRef(() => TenantsService))
    private tenantsService: TenantsService,
  ) {}

  @Get('permissions')
  async getPermissions(@Req() req: FastifyRequest & { user: any }) {
    const tenantId = req.cookies['active_tenant'];
    return this.usersService.getPermissions(req.user.id, tenantId);
  }

  @Get('tenants')
  async getMyTenants(@Req() req: FastifyRequest & { user: any }) {
    // Returns tenants with role information for the authenticated user
    return this.usersService.getUserTenants(req.user.id);
  }

  @Post('tenants/active')
  @HttpCode(HttpStatus.OK)
  async setActiveTenant(
    @Req() req: any,
    @Body('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // Moved from TenantsController
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const hasAccess = req.user.isSuperAdmin
      ? true
      : await this.tenantsService.validateTenantAccess(req.user.id, tenantId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const tenant = await this.tenantsService.getTenantById(tenantId);
    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant is not active');
    }

    res.setCookie('active_tenant', tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Active tenant set successfully' };
  }

  @Get('tenants/active')
  async getActiveTenant(@Req() req: FastifyRequest & { user: any }) {
    // Moved from TenantsController
    // Note: If no active tenant cookie/header, this might fail or return null?
    // In TenantsController it was guarded by ActiveTenantGuard which set req.tenantId
    // Here we probably want to read the cookie or rely on a guard.
    // However, for /me endpoints, we might want to check if they have one.
    const tenantId = req.cookies['active_tenant'];
    if (!tenantId) {
      // Or return null/404?
      // Frontend expects the tenant object.
      // If no active tenant, maybe 404 is appropriate or just null.
      // Let's assume the frontend calls this to populate context.
      return null;
    }

    try {
      // validate access again just in case?
      // simple read is okay if we trust the cookie + service check
      // but explicit access check is safer.
      if (!req.user.isSuperAdmin) {
        const hasAccess = await this.tenantsService.validateTenantAccess(
          req.user.id,
          tenantId,
        );
        if (!hasAccess) {
          return null;
        }
      }
      const tenant = await this.tenantsService.getTenantById(tenantId);
      if (tenant.status !== 'ACTIVE') {
        return null;
      }
      return tenant;
    } catch (e) {
      return null;
    }
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: FastifyRequest & { user: any },
    @Body() body: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(req.user.id, {
      fullName: body.fullName,
    });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  @Patch('password')
  async updatePassword(
    @Req() req: FastifyRequest & { user: any },
    @Body() body: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password updated successfully' };
  }
}
