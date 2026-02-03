import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { TenantSettingsService } from './tenant-settings.service';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@ApiTags('tenants')
@ApiCookieAuth('access_token')
@Controller('tenant-settings/tenant')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TenantSettingsController {
  constructor(private readonly service: TenantSettingsService) {}

  @Get()
  @RequirePermissions('settings.tenant.read')
  async getSettings(@CurrentTenant() tenantId: string) {
    return this.service.getSettings(tenantId);
  }

  @Put()
  @RequirePermissions('settings.tenant.update')
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.service.updateSettings(tenantId, dto);
  }
}
