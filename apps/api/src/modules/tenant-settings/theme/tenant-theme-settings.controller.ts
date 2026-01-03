import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { TenantThemeSettingsService } from './tenant-theme-settings.service';
import { UpdateTenantThemeSettingsDto } from './dto/update-tenant-theme-settings.dto';
import { TenantThemeSettingsResponseDto } from './dto/tenant-theme-settings-response.dto';
import { ActiveTenantGuard } from '../../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@ApiTags('theme')
@ApiCookieAuth('access_token')
@Controller('tenant-settings/theme')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TenantThemeSettingsController {
  constructor(private readonly service: TenantThemeSettingsService) {}

  @Get()
  @RequirePermissions('settings.theme.read')
  async getSettings(
    @CurrentTenant() tenantId: string,
  ): Promise<TenantThemeSettingsResponseDto> {
    return this.service.getSettings(tenantId);
  }

  @Put()
  @RequirePermissions('settings.theme.update')
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantThemeSettingsDto,
  ): Promise<void> {
    return this.service.updateSettings(tenantId, dto);
  }
}
