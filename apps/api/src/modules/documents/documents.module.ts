import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentStatusHistoryEntity,
  DocumentNumberSettingEntity,
  LedgerEntryEntity,
  DocumentTypeRegistryEntity,
  DocumentOutboxEntity,
  DocumentRelationEntity,
} from '../../database/entities';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentNumberService } from './document-number.service';
import { DocumentOutboxService } from './document-outbox.service';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentEntity,
      DocumentItemEntity,
      DocumentApprovalEntity,
      DocumentStatusHistoryEntity,
      DocumentNumberSettingEntity,
      LedgerEntryEntity,
      DocumentTypeRegistryEntity,
      DocumentOutboxEntity,
      DocumentRelationEntity,
    ]),
    UsersModule,
    TenantsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentNumberService, DocumentOutboxService],
  exports: [DocumentsService, DocumentNumberService, DocumentOutboxService],
})
export class DocumentsModule {}
