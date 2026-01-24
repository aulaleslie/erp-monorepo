import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ActiveTenantGuard } from '../../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SalesApprovalsService } from './sales-approvals.service';
import { UpdateApprovalConfigDto } from './dtos/update-approval-config.dto';

@ApiTags('sales-approvals')
@ApiCookieAuth('access_token')
@Controller('sales/approvals/config')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class SalesApprovalsController {
  constructor(private readonly salesApprovalsService: SalesApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get sales approval config' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async getConfig(
    @CurrentTenant() tenantId: string,
    @Query('documentKey') documentKey: string,
  ) {
    return this.salesApprovalsService.getConfig(tenantId, documentKey);
  }

  @Put()
  @ApiOperation({ summary: 'Update sales approval config' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE, PERMISSIONS.SALES.UPDATE)
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateApprovalConfigDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesApprovalsService.updateConfig(tenantId, dto, userId);
  }
}
