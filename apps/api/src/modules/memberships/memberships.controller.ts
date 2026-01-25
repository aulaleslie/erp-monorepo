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
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { MembershipsService } from './memberships.service';
import { MembershipHistoryService } from './membership-history.service';
import { MembershipEntity } from '../../database/entities/membership.entity';
import { MembershipHistoryEntity } from '../../database/entities/membership-history.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { ClearMembershipReviewDto } from './dto/clear-membership-review.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipQueryDto } from './dto/membership-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@ApiTags('memberships')
@ApiCookieAuth('access_token')
@Controller('memberships')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly historyService: MembershipHistoryService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: MembershipQueryDto,
  ): Promise<PaginatedResponse<MembershipEntity>> {
    return this.membershipsService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.READ)
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<MembershipEntity> {
    return this.membershipsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.CREATE)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMembershipDto,
  ): Promise<MembershipEntity> {
    return this.membershipsService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.UPDATE)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipDto,
  ): Promise<MembershipEntity> {
    return this.membershipsService.update(tenantId, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.CANCEL)
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<MembershipEntity> {
    return this.membershipsService.cancel(tenantId, id);
  }

  @Post(':id/clear-review')
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.UPDATE)
  async clearReview(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ClearMembershipReviewDto,
  ): Promise<MembershipEntity> {
    return this.membershipsService.clearReview(
      tenantId,
      id,
      dto.action,
      dto.reason,
    );
  }

  @Get(':id/history')
  @RequirePermissions(PERMISSIONS.MEMBERSHIPS.READ)
  async findHistory(
    @Param('id') id: string,
  ): Promise<MembershipHistoryEntity[]> {
    return this.historyService.findByMembershipId(id);
  }
}
