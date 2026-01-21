import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  ApprovalStatus,
  DocumentModule,
  DocumentStatus,
  DOCUMENT_ERRORS,
} from '@gym-monorepo/shared';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentStatusHistoryEntity,
} from '../../database/entities';
import {
  getApprovalStepsCount,
  isValidTransition,
} from './state-machine/document-state-machine';
import { DocumentNumberService } from './document-number.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentItemEntity)
    private readonly documentItemRepository: Repository<DocumentItemEntity>,
    @InjectRepository(DocumentApprovalEntity)
    private readonly approvalRepository: Repository<DocumentApprovalEntity>,
    @InjectRepository(DocumentStatusHistoryEntity)
    private readonly historyRepository: Repository<DocumentStatusHistoryEntity>,
    private readonly dataSource: DataSource,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  async create(
    tenantId: string,
    documentKey: string,
    module: DocumentModule,
    data: Partial<DocumentEntity>,
    userId: string,
  ): Promise<DocumentEntity> {
    const documentNumber =
      await this.documentNumberService.getNextDocumentNumber(
        tenantId,
        documentKey,
      );

    const document = this.documentRepository.create({
      ...data,
      tenantId,
      documentKey,
      module,
      number: documentNumber,
      status: DocumentStatus.DRAFT,
      createdBy: userId,
    });

    return this.documentRepository.save(document);
  }

  async findOne(id: string, tenantId: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findOne({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException(DOCUMENT_ERRORS.NOT_FOUND.message);
    }

    return document;
  }

  async submit(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.findOne(id, tenantId);

      this.validateTransition(document, DocumentStatus.SUBMITTED);
      await this.validateItemsForSubmit(document, manager);

      const fromStatus = document.status;
      document.status = DocumentStatus.SUBMITTED;
      document.submittedAt = new Date();
      await manager.save(document);

      // Create multi-step approval records
      const stepsCount = getApprovalStepsCount(document.documentKey);
      for (let i = 0; i < stepsCount; i++) {
        const approval = manager.create(DocumentApprovalEntity, {
          documentId: id,
          stepIndex: i,
          status: ApprovalStatus.PENDING,
          requestedByUserId: userId,
        });
        await manager.save(approval);
      }

      await this.recordStatusHistory(
        id,
        fromStatus,
        DocumentStatus.SUBMITTED,
        userId,
        null,
        manager,
      );

      return document;
    });
  }

  async approveStep(
    id: string,
    stepIndex: number,
    notes: string | null,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.findOne(id, tenantId);

      if (document.status !== DocumentStatus.SUBMITTED) {
        throw new BadRequestException(
          DOCUMENT_ERRORS.INVALID_TRANSITION.message,
        );
      }

      const approval = await this.validateApprovalStep(id, stepIndex, manager);

      if (stepIndex > 0) {
        const previousApproval = await manager.findOne(DocumentApprovalEntity, {
          where: { documentId: id, stepIndex: stepIndex - 1 },
        });
        if (previousApproval?.status !== ApprovalStatus.APPROVED) {
          throw new BadRequestException(
            DOCUMENT_ERRORS.APPROVAL_STEP_NOT_READY.message,
          );
        }
      }

      approval.status = ApprovalStatus.APPROVED;
      approval.decidedByUserId = userId;
      approval.decidedAt = new Date();
      approval.notes = notes;
      await manager.save(approval);

      const allApproved = await this.checkAllStepsApproved(id, manager);

      if (allApproved) {
        const fromStatus = document.status;
        document.status = DocumentStatus.APPROVED;
        document.approvedAt = new Date();
        await manager.save(document);

        await this.recordStatusHistory(
          id,
          fromStatus,
          DocumentStatus.APPROVED,
          userId,
          notes,
          manager,
        );
      }

      return document;
    });
  }

  async reject(
    id: string,
    notes: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.findOne(id, tenantId);

      this.validateTransition(document, DocumentStatus.REJECTED);

      const fromStatus = document.status;
      document.status = DocumentStatus.REJECTED;
      document.rejectedAt = new Date();
      await manager.save(document);

      // Mark current and pending approvals as REJECTED
      await manager.update(
        DocumentApprovalEntity,
        { documentId: id, status: ApprovalStatus.PENDING },
        {
          status: ApprovalStatus.REJECTED,
          decidedByUserId: userId,
          decidedAt: new Date(),
          notes,
        },
      );

      await this.recordStatusHistory(
        id,
        fromStatus,
        DocumentStatus.REJECTED,
        userId,
        notes,
        manager,
      );

      return document;
    });
  }

  async requestRevision(
    id: string,
    reason: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.findOne(id, tenantId);

      this.validateTransition(document, DocumentStatus.REVISION_REQUESTED);

      const fromStatus = document.status;

      // Document transitions to REVISION_REQUESTED then quickly to DRAFT
      document.status = DocumentStatus.DRAFT;
      document.revisionRequestedAt = new Date();
      await manager.save(document);

      // Mark approvals as REVISION_REQUESTED
      await manager.update(
        DocumentApprovalEntity,
        { documentId: id, status: ApprovalStatus.PENDING },
        {
          status: ApprovalStatus.REVISION_REQUESTED,
          decidedByUserId: userId,
          decidedAt: new Date(),
          notes: reason,
        },
      );

      await this.recordStatusHistory(
        id,
        fromStatus,
        DocumentStatus.REVISION_REQUESTED,
        userId,
        reason,
        manager,
      );

      await this.recordStatusHistory(
        id,
        DocumentStatus.REVISION_REQUESTED,
        DocumentStatus.DRAFT,
        userId,
        'Auto-transferred to DRAFT after revision request',
        manager,
      );

      return document;
    });
  }

  async post(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.findOne(id, tenantId);

      this.validateTransition(document, DocumentStatus.POSTED);

      const fromStatus = document.status;
      document.status = DocumentStatus.POSTED;
      document.postedAt = new Date();
      document.postingDate = document.postingDate || new Date();
      await manager.save(document);

      await this.recordStatusHistory(
        id,
        fromStatus,
        DocumentStatus.POSTED,
        userId,
        null,
        manager,
      );

      return document;
    });
  }

  async cancel(
    id: string,
    reason: string | null,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.findOne(id, tenantId);

      this.validateTransition(document, DocumentStatus.CANCELLED);

      const fromStatus = document.status;
      document.status = DocumentStatus.CANCELLED;
      document.cancelledAt = new Date();
      await manager.save(document);

      // Optionally clear pending approvals
      await manager.delete(DocumentApprovalEntity, {
        documentId: id,
        status: ApprovalStatus.PENDING,
      });

      await this.recordStatusHistory(
        id,
        fromStatus,
        DocumentStatus.CANCELLED,
        userId,
        reason,
        manager,
      );

      return document;
    });
  }

  async getApprovals(
    documentId: string,
    tenantId: string,
  ): Promise<DocumentApprovalEntity[]> {
    // Basic existence check
    await this.findOne(documentId, tenantId);

    return this.approvalRepository.find({
      where: { documentId },
      order: { stepIndex: 'ASC' },
      relations: { requestedByUser: true, decidedByUser: true },
    });
  }

  async getStatusHistory(
    documentId: string,
    tenantId: string,
  ): Promise<DocumentStatusHistoryEntity[]> {
    // Basic existence check
    await this.findOne(documentId, tenantId);

    return this.historyRepository.find({
      where: { documentId },
      order: { changedAt: 'DESC' },
      relations: { changedByUser: true },
    });
  }

  private async recordStatusHistory(
    documentId: string,
    fromStatus: DocumentStatus,
    toStatus: DocumentStatus,
    userId: string,
    reason: string | null,
    manager: EntityManager,
  ): Promise<void> {
    const history = manager.create(DocumentStatusHistoryEntity, {
      documentId,
      fromStatus,
      toStatus,
      changedByUserId: userId,
      reason,
      changedAt: new Date(),
    });
    await manager.save(history);
  }

  private validateTransition(
    document: DocumentEntity,
    targetStatus: DocumentStatus,
  ): void {
    if (!isValidTransition(document.status, targetStatus)) {
      throw new BadRequestException(DOCUMENT_ERRORS.INVALID_TRANSITION.message);
    }
  }

  private async validateItemsForSubmit(
    document: DocumentEntity,
    manager: EntityManager,
  ): Promise<void> {
    if (
      document.module === DocumentModule.SALES ||
      document.module === DocumentModule.PURCHASE
    ) {
      const count = await manager.count(DocumentItemEntity, {
        where: { documentId: document.id },
      });
      if (count === 0) {
        throw new BadRequestException(DOCUMENT_ERRORS.ITEMS_REQUIRED.message);
      }
    }
  }

  private async checkAllStepsApproved(
    documentId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const pendingCount = await manager.count(DocumentApprovalEntity, {
      where: { documentId, status: ApprovalStatus.PENDING },
    });
    return pendingCount === 0;
  }

  private async validateApprovalStep(
    documentId: string,
    stepIndex: number,
    manager: EntityManager,
  ): Promise<DocumentApprovalEntity> {
    const approval = await manager.findOne(DocumentApprovalEntity, {
      where: { documentId, stepIndex },
    });

    if (!approval) {
      throw new NotFoundException(DOCUMENT_ERRORS.APPROVAL_NOT_FOUND.message);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        DOCUMENT_ERRORS.APPROVAL_ALREADY_DECIDED.message,
      );
    }

    return approval;
  }
}
