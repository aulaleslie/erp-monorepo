import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesAttachmentEntity } from '../../../database/entities/sales-attachment.entity';
import { DocumentEntity } from '../../../database/entities/document.entity';
import { StorageService } from '../../storage/storage.service';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class SalesAttachmentsService {
  constructor(
    @InjectRepository(SalesAttachmentEntity)
    private readonly attachmentRepository: Repository<SalesAttachmentEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(
    tenantId: string,
    documentId: string,
  ): Promise<SalesAttachmentEntity[]> {
    return this.attachmentRepository.find({
      where: { tenantId, documentId },
      order: { createdAt: 'DESC' },
    });
  }

  async upload(
    tenantId: string,
    documentId: string,
    file: UploadedFile,
    userId: string,
  ): Promise<SalesAttachmentEntity> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const count = await this.attachmentRepository.count({
      where: { documentId, tenantId },
    });

    if (count >= 5) {
      throw new BadRequestException(
        'Maximum 5 attachments per document reached',
      );
    }

    const keyPrefix = `sales/attachments/${tenantId}/${documentId}`;
    const storageKey = this.storageService.generateObjectKey(
      keyPrefix,
      file.originalname,
    );

    const publicUrl = await this.storageService.uploadDocument(
      file.buffer,
      storageKey,
      file.mimetype,
      file.size,
    );

    const attachment = this.attachmentRepository.create({
      tenantId,
      documentId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      publicUrl,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.attachmentRepository.save(attachment);
  }

  async remove(
    tenantId: string,
    documentId: string,
    attachmentId: string,
  ): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId, documentId, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.storageService.deleteFile(attachment.storageKey);
    await this.attachmentRepository.remove(attachment);
  }
}
