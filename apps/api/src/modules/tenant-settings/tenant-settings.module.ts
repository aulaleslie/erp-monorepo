import { Module } from '@nestjs/common';
import { TenantTaxSettingsModule } from './tax/tenant-tax-settings.module';
import { TenantProfileSettingsModule } from './tenant/tenant-settings.module';
import { TenantThemeSettingsModule } from './theme/tenant-theme-settings.module';

@Module({
  imports: [
    TenantTaxSettingsModule,
    TenantProfileSettingsModule,
    TenantThemeSettingsModule,
  ],
})
export class TenantSettingsModule {}
