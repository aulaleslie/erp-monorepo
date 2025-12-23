import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { FastifyReply, FastifyRequest } from 'fastify';

@Controller('tenants')
@UseGuards(AuthGuard('jwt'))
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('my')
  async getMyTenants(@Req() req: any) {
    // req.user is populated by AuthGuard (Passport)
    return this.tenantsService.getMyTenants(req.user.id);
  }

  @Post('active')
  @HttpCode(HttpStatus.OK)
  async setActiveTenant(
    @Req() req: any,
    @Body('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const hasAccess = await this.tenantsService.validateTenantAccess(
      req.user.id,
      tenantId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Verify tenant actually exists and is active (validateTenantAccess only checks link)
    // Actually getMyTenants checks status, let's double check existence/status here or inside service.
    // simpler: validateTenantAccess is enough for permission, but let's check if it returns
    // true it means row exists. The row existing in TenantUser implies Tenant exists usually,
    // but better to be safe.  Service.getTenantById throws if not found.
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

  @Get('active')
  async getActiveTenant(
    @Req() req: FastifyRequest & { user: any },
  ) {
    const tenantId = req.cookies['active_tenant'];

    if (!tenantId) {
      // It's acceptable to have no active tenant selected
      throw new NotFoundException('No active tenant selected');
    }

    // Validate access again to ensure user still has permission
    const hasAccess = await this.tenantsService.validateTenantAccess(
      req.user.id,
      tenantId,
    );

    if (!hasAccess) {
       throw new ForbiddenException('You no longer have access to this tenant');
    }

    return this.tenantsService.getTenantById(tenantId);
  }
}
