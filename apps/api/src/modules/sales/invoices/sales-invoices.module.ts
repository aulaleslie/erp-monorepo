import { Module, forwardRef } from '@nestjs/common';
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
import { SalesInvoicesController } from './sales-invoices.controller';
import { SalesInvoicesService } from './sales-invoices.service';
import { SalesCreditNotesModule } from '../credit-notes/sales-credit-notes.module';
import { SalesApprovalsModule } from '../approvals/sales-approvals.module';
import { MembershipsModule } from '../../memberships/memberships.module';
import { PtSessionPackagesModule } from '../../pt-session-packages/pt-session-packages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesHeaderEntity,
      DocumentEntity,
      DocumentItemEntity,
      PeopleEntity,
      DocumentRelationEntity,
      ItemEntity,
      TagEntity,
      TagLinkEntity,
    ]),
    DocumentsModule,
    PeopleModule,
    TenantsModule,
    UsersModule,
    forwardRef(() => SalesCreditNotesModule),
    SalesApprovalsModule,
    MembershipsModule,
    PtSessionPackagesModule,
  ],
  controllers: [SalesInvoicesController],
  providers: [SalesInvoicesService],
  exports: [SalesInvoicesService],
})
export class SalesInvoicesModule {}
