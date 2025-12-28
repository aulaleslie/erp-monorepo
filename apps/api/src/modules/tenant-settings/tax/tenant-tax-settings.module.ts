import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { Tax } from '../../../database/entities/tax.entity';
import { TenantTaxEntity } from '../../../database/entities/tenant-tax.entity';
import { TenantTaxSettingsController } from './tenant-tax-settings.controller';
import { TenantTaxSettingsService } from './tenant-tax-settings.service';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      Tax,
      TenantTaxEntity,
    ]),
    TenantsModule,
    UsersModule,
  ],
  controllers: [TenantTaxSettingsController],
  providers: [TenantTaxSettingsService],
})
export class TenantTaxSettingsModule {}
