import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesAttachmentEntity } from '../../../database/entities/sales-attachment.entity';
import { DocumentEntity } from '../../../database/entities/document.entity';
import { SalesAttachmentsController } from './sales-attachments.controller';
import { SalesAttachmentsService } from './sales-attachments.service';
import { StorageModule } from '../../storage/storage.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesAttachmentEntity, DocumentEntity]),
    StorageModule,
    UsersModule,
  ],
  controllers: [SalesAttachmentsController],
  providers: [SalesAttachmentsService],
  exports: [SalesAttachmentsService],
})
export class SalesAttachmentsModule {}
