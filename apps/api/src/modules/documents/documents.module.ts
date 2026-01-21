import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentStatusHistoryEntity,
  DocumentNumberSettingEntity,
} from '../../database/entities';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentNumberService } from './document-number.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentEntity,
      DocumentItemEntity,
      DocumentApprovalEntity,
      DocumentStatusHistoryEntity,
      DocumentNumberSettingEntity,
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentNumberService],
  exports: [DocumentsService, DocumentNumberService],
})
export class DocumentsModule {}
