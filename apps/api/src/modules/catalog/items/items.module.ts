import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantCountersModule } from '../../tenant-counters/tenant-counters.module';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { ItemEntity } from '../../../database/entities/item.entity';
import { CategoryEntity } from '../../../database/entities/category.entity';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemEntity, CategoryEntity]),
    TenantCountersModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
