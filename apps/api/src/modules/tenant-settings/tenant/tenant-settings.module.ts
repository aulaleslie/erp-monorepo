import { Module } from '@nestjs/common';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { TenantSettingsController } from './tenant-settings.controller';
import { TenantSettingsService } from './tenant-settings.service';

@Module({
  imports: [TenantsModule, UsersModule],
  controllers: [TenantSettingsController],
  providers: [TenantSettingsService],
})
export class TenantProfileSettingsModule {}
