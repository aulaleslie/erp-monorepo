import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { TenantTaxSettingsService } from './tenant-tax-settings.service';
import { UpdateTenantTaxSettingsDto } from './dto/update-tenant-tax-settings.dto';
import { TenantTaxSettingsResponseDto } from './dto/tenant-tax-settings-response.dto';
import { ActiveTenantGuard } from '../../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';

@Controller('tenant-settings/tax')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  SuperAdminGuard,
)
export class TenantTaxSettingsController {
  constructor(private readonly service: TenantTaxSettingsService) {}

  @Get()
  async getSettings(
    @CurrentTenant() tenantId: string,
  ): Promise<TenantTaxSettingsResponseDto> {
    return this.service.getSettings(tenantId);
  }

  @Put()
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantTaxSettingsDto,
  ): Promise<void> {
    return this.service.updateSettings(tenantId, dto);
  }
}
