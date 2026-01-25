import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ApprovalStatus,
  DocumentStatus,
  SALES_ERRORS,
  DOCUMENT_ERRORS,
} from '@gym-monorepo/shared';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  SalesApprovalEntity,
  SalesApprovalLevelEntity,
  SalesApprovalLevelRoleEntity,
  UserEntity,
  TenantUserEntity,
} from '../../../database/entities';
import { DocumentsService } from '../../documents/documents.service';

@Injectable()
export class SalesApprovalsService {
  constructor(
    @InjectRepository(SalesApprovalEntity)
    private readonly salesApprovalRepository: Repository<SalesApprovalEntity>,
    @InjectRepository(SalesApprovalLevelEntity)
    private readonly levelRepository: Repository<SalesApprovalLevelEntity>,
    @InjectRepository(DocumentApprovalEntity)
    private readonly docApprovalRepository: Repository<DocumentApprovalEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly documentsService: DocumentsService,
    private readonly dataSource: DataSource,
  ) {}

  async submit(
    documentId: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.findOne(
      documentId,
      tenantId,
      userId,
    );

    const levels = await this.levelRepository.find({
      where: { tenantId, documentKey: document.documentKey, isActive: true },
      order: { levelIndex: 'ASC' },
    });

    if (levels.length === 0) {
      throw new BadRequestException(
        SALES_ERRORS.MISSING_APPROVAL_CONFIG.message,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Call base submit (this will update status to SUBMITTED and record history)
      // Since we set approvalSteps to 0 in registry, it won't create any DocumentApprovalEntity records
      const submittedDoc = await this.documentsService.submit(
        documentId,
        tenantId,
        userId,
      );

      // 2. Create Sales Approval Records
      for (const level of levels) {
        const salesApproval = manager.create(SalesApprovalEntity, {
          documentId,
          levelIndex: level.levelIndex,
          status: ApprovalStatus.PENDING,
          requestedByUserId: userId,
        });
        await manager.save(salesApproval);

        // 3. Create Document Approval Records for compatibility
        const docApproval = manager.create(DocumentApprovalEntity, {
          documentId,
          stepIndex: level.levelIndex,
          status: ApprovalStatus.PENDING,
          requestedByUserId: userId,
        });
        await manager.save(docApproval);
      }

      return submittedDoc;
    });
  }

  async approve(
    documentId: string,
    notes: string | null,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const document = await this.documentsService.findOne(
        documentId,
        tenantId,
        userId,
      );

      if (document.status !== DocumentStatus.SUBMITTED) {
        throw new BadRequestException(
          DOCUMENT_ERRORS.INVALID_TRANSITION.message,
        );
      }

      // Find current pending level
      const currentApproval = await manager.findOne(SalesApprovalEntity, {
        where: { documentId, status: ApprovalStatus.PENDING },
        order: { levelIndex: 'ASC' },
      });

      if (!currentApproval) {
        throw new NotFoundException(DOCUMENT_ERRORS.APPROVAL_NOT_FOUND.message);
      }

      // Validate level configuration exists
      const level = await manager.findOne(SalesApprovalLevelEntity, {
        where: {
          tenantId,
          documentKey: document.documentKey,
          levelIndex: currentApproval.levelIndex,
          isActive: true,
        },
        relations: { roles: true },
      });

      if (!level) {
        throw new BadRequestException(
          SALES_ERRORS.MISSING_APPROVAL_CONFIG.message,
        );
      }

      // Check permissions: User must have one of the required roles in this tenant
      const tenantUser = await manager.findOne(TenantUserEntity, {
        where: { tenantId, userId },
      });

      if (!tenantUser || !tenantUser.roleId) {
        // Double check if super admin
        const user = await manager.findOne(UserEntity, {
          where: { id: userId },
        });
        if (!user?.isSuperAdmin) {
          throw new ForbiddenException(DOCUMENT_ERRORS.ACCESS_DENIED.message);
        }
      } else {
        const allowedRoleIds = level.roles.map((r) => r.roleId);
        const canApprove = allowedRoleIds.includes(tenantUser.roleId);

        if (!canApprove) {
          // Double check if super admin
          const user = await manager.findOne(UserEntity, {
            where: { id: userId },
          });
          if (!user?.isSuperAdmin) {
            throw new ForbiddenException(DOCUMENT_ERRORS.ACCESS_DENIED.message);
          }
        }
      }

      // Update Sales Approval
      currentApproval.status = ApprovalStatus.APPROVED;
      currentApproval.decidedByUserId = userId;
      currentApproval.decidedAt = new Date();
      currentApproval.notes = notes;
      await manager.save(currentApproval);

      // Sync with DocumentsService (updates DocumentApprovalEntity and Document status)
      return this.documentsService.approveStep(
        documentId,
        currentApproval.levelIndex,
        notes,
        tenantId,
        userId,
      );
    });
  }

  async reject(
    documentId: string,
    notes: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Mark all pending sales approvals as REJECTED
      await manager.update(
        SalesApprovalEntity,
        { documentId, status: ApprovalStatus.PENDING },
        {
          status: ApprovalStatus.REJECTED,
          decidedByUserId: userId,
          decidedAt: new Date(),
          notes,
        },
      );

      // 2. Delegate to DocumentsService (this handles DocumentApprovalEntity sync and status change)
      return this.documentsService.reject(documentId, notes, tenantId, userId);
    });
  }

  async requestRevision(
    documentId: string,
    reason: string,
    tenantId: string,
    userId: string,
  ): Promise<DocumentEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Mark all pending sales approvals as REVISION_REQUESTED
      await manager.update(
        SalesApprovalEntity,
        { documentId, status: ApprovalStatus.PENDING },
        {
          status: ApprovalStatus.REVISION_REQUESTED,
          decidedByUserId: userId,
          decidedAt: new Date(),
          notes: reason,
        },
      );

      // 2. Delegate to DocumentsService (this handles DocumentApprovalEntity sync and status change to DRAFT)
      return this.documentsService.requestRevision(
        documentId,
        reason,
        tenantId,
        userId,
      );
    });
  }

  async getConfig(
    tenantId: string,
    documentKey: string,
  ): Promise<SalesApprovalLevelEntity[]> {
    return this.levelRepository.find({
      where: { tenantId, documentKey },
      order: { levelIndex: 'ASC' },
      relations: { roles: { role: true } },
    });
  }

  async updateConfig(
    tenantId: string,
    dto: {
      documentKey: string;
      levels: Array<{
        levelIndex: number;
        roleIds: string[];
        isActive?: boolean;
      }>;
    },
    userId: string,
  ): Promise<SalesApprovalLevelEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Delete existing config for this document type
      const existingLevels = await manager.find(SalesApprovalLevelEntity, {
        where: { tenantId, documentKey: dto.documentKey },
      });

      for (const level of existingLevels) {
        await manager.delete('SalesApprovalLevelRoleEntity', {
          salesApprovalLevelId: level.id,
        });
      }
      await manager.delete(SalesApprovalLevelEntity, {
        tenantId,
        documentKey: dto.documentKey,
      });

      // 2. Create new config
      for (const levelDto of dto.levels) {
        const level = manager.create(SalesApprovalLevelEntity, {
          tenantId,
          documentKey: dto.documentKey,
          levelIndex: levelDto.levelIndex,
          isActive: levelDto.isActive !== undefined ? levelDto.isActive : true,
          createdBy: userId,
        });
        await manager.save(level);

        for (const roleId of levelDto.roleIds) {
          const levelRole = manager.create('SalesApprovalLevelRoleEntity', {
            salesApprovalLevelId: level.id,
            roleId,
          });
          await manager.save(levelRole);
        }
      }

      return this.getConfig(tenantId, dto.documentKey);
    });
  }

  async getMyPendingCount(
    tenantId: string,
    userId: string,
  ): Promise<{ count: number }> {
    // 1. Get user and their role in this tenant
    const [user, tenantUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.userRepository.manager.findOne(TenantUserEntity, {
        where: { tenantId, userId },
      }),
    ]);

    if (!user) {
      return { count: 0 };
    }

    // 2. Build query for pending approvals
    const query = this.salesApprovalRepository
      .createQueryBuilder('approval')
      .innerJoin('approval.document', 'document')
      .innerJoin(
        SalesApprovalLevelEntity,
        'level',
        'level.tenantId = document.tenantId AND level.documentKey = document.documentKey AND level.levelIndex = approval.levelIndex',
      )
      .innerJoin(
        SalesApprovalLevelRoleEntity,
        'levelRole',
        'levelRole.salesApprovalLevelId = level.id',
      )
      .where('document.tenantId = :tenantId', { tenantId })
      .andWhere('approval.status = :status', { status: ApprovalStatus.PENDING })
      .andWhere('level.isActive = true');

    // 3. Filter by role or allow all if super admin
    if (!user.isSuperAdmin) {
      if (!tenantUser || !tenantUser.roleId) {
        return { count: 0 };
      }
      query.andWhere('levelRole.roleId = :roleId', {
        roleId: tenantUser.roleId,
      });
    }

    // 4. Count unique documents
    const result = await query
      .select('COUNT(DISTINCT approval.documentId)', 'count')
      .getRawOne();

    return { count: parseInt(result?.count || '0', 10) || 0 };
  }
}
