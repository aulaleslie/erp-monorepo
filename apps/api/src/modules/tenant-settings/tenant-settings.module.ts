import { Module } from '@nestjs/common';
import { TenantTaxSettingsModule } from './tax/tenant-tax-settings.module';
import { TenantProfileSettingsModule } from './tenant/tenant-settings.module';

@Module({
  imports: [TenantTaxSettingsModule, TenantProfileSettingsModule],
})
export class TenantSettingsModule {}
