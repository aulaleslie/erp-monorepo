import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { TenantSchedulingSettingsService } from './tenant-scheduling-settings.service';
import { UpdateTenantSchedulingSettingsDto } from './dto/update-tenant-scheduling-settings.dto';
import { TenantSchedulingSettingsResponseDto } from './dto/tenant-scheduling-settings-response.dto';
import { ActiveTenantGuard } from '../../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@ApiTags('tenant-settings')
@ApiCookieAuth('access_token')
@Controller('tenant-settings/scheduling')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TenantSchedulingSettingsController {
  constructor(private readonly service: TenantSchedulingSettingsService) {}

  @Get()
  @RequirePermissions('settings.tenant.read')
  async getSettings(
    @CurrentTenant() tenantId: string,
  ): Promise<TenantSchedulingSettingsResponseDto> {
    return this.service.getSettings(tenantId);
  }

  @Put()
  @RequirePermissions('settings.tenant.update')
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantSchedulingSettingsDto,
  ): Promise<TenantSchedulingSettingsResponseDto> {
    return this.service.updateSettings(tenantId, dto);
  }
}
