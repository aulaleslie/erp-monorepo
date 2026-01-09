import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from '../../database/entities';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { TenantCountersModule } from '../tenant-counters/tenant-counters.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartmentEntity]),
    TenantCountersModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
