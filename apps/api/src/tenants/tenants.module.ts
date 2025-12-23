import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantEntity } from '../database/entities/tenant.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';

import { ActiveTenantGuard } from './guards/active-tenant.guard';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, TenantUserEntity]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService, ActiveTenantGuard, TenantMembershipGuard],
  exports: [TenantsService, ActiveTenantGuard, TenantMembershipGuard],
})
export class TenantsModule {}
