import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantCountersModule } from '../../tenant-counters/tenant-counters.module';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { CategoryEntity } from '../../../database/entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
    TenantCountersModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
