import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantEntity } from '../database/entities/tenant.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, TenantUserEntity]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
