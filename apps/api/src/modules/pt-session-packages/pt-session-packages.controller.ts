import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { PtSessionPackagesService } from './pt-session-packages.service';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { CreatePtPackageDto } from './dto/create-pt-package.dto';
import { UpdatePtPackageDto } from './dto/update-pt-package.dto';
import { PtPackageQueryDto } from './dto/pt-package-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@ApiTags('pt-packages')
@ApiCookieAuth('access_token')
@Controller('pt-packages')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class PtSessionPackagesController {
  constructor(
    private readonly ptSessionPackagesService: PtSessionPackagesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PT_SESSIONS.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: PtPackageQueryDto,
  ): Promise<PaginatedResponse<PtPackageEntity>> {
    return this.ptSessionPackagesService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PT_SESSIONS.READ)
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<PtPackageEntity> {
    return this.ptSessionPackagesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PT_SESSIONS.CREATE)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePtPackageDto,
  ): Promise<PtPackageEntity> {
    return this.ptSessionPackagesService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PT_SESSIONS.UPDATE)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePtPackageDto,
  ): Promise<PtPackageEntity> {
    return this.ptSessionPackagesService.update(tenantId, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.PT_SESSIONS.CANCEL)
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<PtPackageEntity> {
    return this.ptSessionPackagesService.cancel(tenantId, id);
  }
}
