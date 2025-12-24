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
  Res,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from './guards/active-tenant.guard';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';
import { TenantsService } from './tenants.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

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
  @UseGuards(ActiveTenantGuard, TenantMembershipGuard)
  async getActiveTenant(@Req() req: any) {
    return this.tenantsService.getTenantById(req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt')) // No tenant/membership guard needed, but need superadmin check
  async createTenant(@Req() req: any, @Body() body: CreateTenantDto) {
    // Check if user is superadmin
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can create tenants');
    }
    return this.tenantsService.create(req.user.id, body);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can view all tenants');
    }
    return this.tenantsService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Req() req: any, @Param('id') id: string) {
    // This endpoint specifically for management, so superadmin only?
    // Or if I am a member of it?
    // For "Tenants Menu" CRUD, it implies Admin.
    // Existing logic has `getTenantById` which serves both.
    // But let's restrict this route for Admin context or check membership.
    // Given the requirement "like roles but for tenants menu", it implies management.

    if (req.user.isSuperAdmin) {
      return this.tenantsService.getTenantById(id);
    }

    // Check membership if not super admin?
    // tenantsService.validateTenantAccess(req.user.id, id)
    const hasAccess = await this.tenantsService.validateTenantAccess(
      req.user.id,
      id,
    );
    if (hasAccess) {
      return this.tenantsService.getTenantById(id);
    }

    throw new ForbiddenException('You do not have access to this tenant');
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto,
  ) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can update tenants');
    }
    return this.tenantsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: any, @Param('id') id: string) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can delete tenants');
    }
    await this.tenantsService.delete(id);
  }
}
