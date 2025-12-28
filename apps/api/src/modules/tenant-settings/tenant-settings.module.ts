import { Module } from '@nestjs/common';
import { TenantTaxSettingsModule } from './tax/tenant-tax-settings.module';

@Module({
  imports: [TenantTaxSettingsModule],
})
export class TenantSettingsModule {}
