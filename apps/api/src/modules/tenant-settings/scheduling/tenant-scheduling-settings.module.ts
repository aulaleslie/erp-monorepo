import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSchedulingSettingsEntity } from '../../../database/entities/tenant-scheduling-settings.entity';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { TenantSchedulingSettingsController } from './tenant-scheduling-settings.controller';
import { TenantSchedulingSettingsService } from './tenant-scheduling-settings.service';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantSchedulingSettingsEntity, TenantEntity]),
    TenantsModule,
    UsersModule,
  ],
  controllers: [TenantSchedulingSettingsController],
  providers: [TenantSchedulingSettingsService],
  exports: [TenantSchedulingSettingsService],
})
export class TenantSchedulingSettingsModule {}
