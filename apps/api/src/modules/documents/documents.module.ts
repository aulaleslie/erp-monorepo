import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentStatusHistoryEntity,
} from '../../database/entities';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentEntity,
      DocumentItemEntity,
      DocumentApprovalEntity,
      DocumentStatusHistoryEntity,
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
