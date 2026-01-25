import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DocumentEntity,
  DocumentItemEntity,
  DocumentRelationEntity,
  SalesHeaderEntity,
  PeopleEntity,
  ItemEntity,
  TagEntity,
  TagLinkEntity,
} from '../../../database/entities';
import { DocumentsModule } from '../../documents/documents.module';
import { SalesCreditNotesController } from './sales-credit-notes.controller';
import { SalesCreditNotesService } from './sales-credit-notes.service';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';
import { PeopleModule } from '../../people/people.module';
import { SalesApprovalsModule } from '../approvals/sales-approvals.module';
import { MembershipsModule } from '../../memberships/memberships.module';

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
    TenantsModule,
    UsersModule,
    PeopleModule,
    PeopleModule,
    SalesApprovalsModule,
    MembershipsModule,
  ],
  controllers: [SalesCreditNotesController],
  providers: [SalesCreditNotesService],
  exports: [SalesCreditNotesService],
})
export class SalesCreditNotesModule {}
