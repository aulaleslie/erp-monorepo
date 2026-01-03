import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { TenantThemeEntity } from '../../../database/entities/tenant-theme.entity';
import { TenantThemeSettingsController } from './tenant-theme-settings.controller';
import { TenantThemeSettingsService } from './tenant-theme-settings.service';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, TenantThemeEntity]),
    TenantsModule,
    UsersModule,
  ],
  controllers: [TenantThemeSettingsController],
  providers: [TenantThemeSettingsService],
})
export class TenantThemeSettingsModule {}
