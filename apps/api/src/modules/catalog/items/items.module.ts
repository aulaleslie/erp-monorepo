import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantCountersModule } from '../../tenant-counters/tenant-counters.module';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { StorageModule } from '../../storage/storage.module';
import { ItemEntity } from '../../../database/entities/item.entity';
import { CategoryEntity } from '../../../database/entities/category.entity';
import { TagLinkEntity } from '../../../database/entities/tag-link.entity';
import { ItemsService } from './items.service';
import { ItemsImportService } from './items-import.service';
import { ItemsExportService } from './items-export.service';
import { ItemsController } from './items.controller';
import { TagsModule } from '../../tags/tags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemEntity, CategoryEntity, TagLinkEntity]),
    TenantCountersModule,
    TenantsModule,
    UsersModule,
    StorageModule,
    TagsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsImportService, ItemsExportService],
  exports: [ItemsService, ItemsImportService, ItemsExportService],
})
export class ItemsModule {}
