import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../../database/entities/sales-header.entity';
import { DocumentRelationEntity } from '../../../database/entities/document-relation.entity';
import { DocumentEntity } from '../../../database/entities/document.entity';
import { DocumentItemEntity } from '../../../database/entities/document-item.entity';
import { PeopleEntity } from '../../../database/entities/people.entity';
import { ItemEntity } from '../../../database/entities/item.entity';
import { DocumentsModule } from '../../documents/documents.module';
import { PeopleModule } from '../../people/people.module';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { SalesInvoicesController } from './sales-invoices.controller';
import { SalesInvoicesService } from './sales-invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesHeaderEntity,
      DocumentRelationEntity,
      DocumentEntity,
      DocumentItemEntity,
      PeopleEntity,
      ItemEntity,
    ]),
    DocumentsModule,
    PeopleModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [SalesInvoicesController],
  providers: [SalesInvoicesService],
  exports: [SalesInvoicesService],
})
export class SalesInvoicesModule {}
