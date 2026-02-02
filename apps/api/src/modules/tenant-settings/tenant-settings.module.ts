import { Module } from '@nestjs/common';
import { TenantTaxSettingsModule } from './tax/tenant-tax-settings.module';
import { TenantProfileSettingsModule } from './tenant/tenant-settings.module';
import { TenantThemeSettingsModule } from './theme/tenant-theme-settings.module';
import { TenantSchedulingSettingsModule } from './scheduling/tenant-scheduling-settings.module';

@Module({
  imports: [
    TenantTaxSettingsModule,
    TenantProfileSettingsModule,
    TenantThemeSettingsModule,
    TenantSchedulingSettingsModule,
  ],
})
export class TenantSettingsModule {}
