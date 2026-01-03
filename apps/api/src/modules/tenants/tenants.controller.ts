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
    @Query('status') status?: 'ACTIVE' | 'DISABLED',
  ) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can view all tenants');
    }
    return this.tenantsService.findAll(Number(page), Number(limit), status ?? 'ACTIVE');
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
