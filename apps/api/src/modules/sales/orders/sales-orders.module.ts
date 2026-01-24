import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../../database/entities/sales-header.entity';
import { DocumentRelationEntity } from '../../../database/entities/document-relation.entity';
import { DocumentEntity } from '../../../database/entities/document.entity';
import { DocumentItemEntity } from '../../../database/entities/document-item.entity';
import { PeopleEntity } from '../../../database/entities/people.entity';
import { ItemEntity } from '../../../database/entities/item.entity';
import { TagEntity } from '../../../database/entities/tag.entity';
import { TagLinkEntity } from '../../../database/entities/tag-link.entity';
import { DocumentsModule } from '../../documents/documents.module';
import { PeopleModule } from '../../people/people.module';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesApprovalsModule } from '../approvals/sales-approvals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesHeaderEntity,
      DocumentRelationEntity,
      DocumentEntity,
      DocumentItemEntity,
      PeopleEntity,
      ItemEntity,
      TagEntity,
      TagLinkEntity,
    ]),
    DocumentsModule,
    PeopleModule,
    TenantsModule,
    TenantsModule,
    UsersModule,
    SalesApprovalsModule,
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
