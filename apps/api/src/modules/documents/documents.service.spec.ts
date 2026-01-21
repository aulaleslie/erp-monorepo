import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
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
import { DocumentsService } from './documents.service';
import { DocumentNumberService } from './document-number.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepo: Repository<DocumentEntity>;
  let dataSource: DataSource;
  let documentNumberService: DocumentNumberService;

  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';
  const mockDocId = 'doc-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DocumentItemEntity),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DocumentApprovalEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DocumentStatusHistoryEntity),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb: (mgr: EntityManager) => Promise<any>) =>
              cb({
                findOne: jest.fn(),
                save: jest.fn(),
                count: jest.fn(),
                create: jest.fn((entity: any, data: any) => data),
                update: jest.fn(),
                delete: jest.fn(),
              } as unknown as EntityManager),
            ),
          },
        },
        {
          provide: DocumentNumberService,
          useValue: {
            getNextDocumentNumber: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentRepo = module.get(getRepositoryToken(DocumentEntity));
    dataSource = module.get(DataSource);
    documentNumberService = module.get<DocumentNumberService>(
      DocumentNumberService,
    );
  });

  const setupTransactionMock = (manager: Partial<EntityManager>) => {
    (dataSource.transaction as jest.Mock).mockImplementation(
      async (cb: (mgr: EntityManager) => Promise<any>) =>
        cb(manager as EntityManager),
    );
  };

  describe('create', () => {
    it('should create a new draft document with a generated number', async () => {
      const mockData = {
        documentDate: new Date(),
        notes: 'Test note',
      };

      (
        documentNumberService.getNextDocumentNumber as jest.Mock
      ).mockResolvedValue('INV-2026-01-000001');
      (documentRepo.create as jest.Mock).mockImplementation(
        (data: any) => data,
      );
      (documentRepo.save as jest.Mock).mockImplementation((doc: any) =>
        Promise.resolve(doc),
      );

      const result = await service.create(
        mockTenantId,
        'sales.invoice',
        DocumentModule.SALES,
        mockData,
        mockUserId,
      );

      expect(result.number).toBe('INV-2026-01-000001');
      expect(result.status).toBe(DocumentStatus.DRAFT);
      expect(result.tenantId).toBe(mockTenantId);
      expect(result.createdBy).toBe(mockUserId);
      expect(documentNumberService.getNextDocumentNumber).toHaveBeenCalledWith(
        mockTenantId,
        'sales.invoice',
      );
    });
  });

  describe('submit', () => {
    it('should transition document from DRAFT to SUBMITTED and create approval records', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.DRAFT,
        module: DocumentModule.SALES,
        documentKey: 'sales.invoice',
      } as DocumentEntity;

      const manager: Partial<EntityManager> = {
        save: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1), // items exist
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.submit(mockDocId, mockTenantId, mockUserId);

      expect(result.status).toBe(DocumentStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockDocId,
          status: DocumentStatus.SUBMITTED,
        }),
      );
      // 1 approval record for sales.invoice
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: mockDocId,
          stepIndex: 0,
          status: ApprovalStatus.PENDING,
        }),
      );
      // Status history
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          fromStatus: DocumentStatus.DRAFT,
          toStatus: DocumentStatus.SUBMITTED,
        }),
      );
    });

    it('should create multiple approval records for purchasing.po', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.DRAFT,
        module: DocumentModule.PURCHASE,
        documentKey: 'purchasing.po',
      } as DocumentEntity;

      const manager: Partial<EntityManager> = {
        save: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      await service.submit(mockDocId, mockTenantId, mockUserId);

      // step 0 and step 1
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ stepIndex: 0 }),
      );
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ stepIndex: 1 }),
      );
    });

    it('should throw if SALES document has no items', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.DRAFT,
        module: DocumentModule.SALES,
      } as DocumentEntity;

      const manager: Partial<EntityManager> = {
        count: jest.fn().mockResolvedValue(0),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      await expect(
        service.submit(mockDocId, mockTenantId, mockUserId),
      ).rejects.toThrow(
        new BadRequestException(DOCUMENT_ERRORS.ITEMS_REQUIRED.message),
      );
    });
  });

  describe('approveStep', () => {
    it('should approve step 0 and transition to APPROVED if single-step', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.SUBMITTED,
        documentKey: 'sales.invoice',
      } as DocumentEntity;

      const mockApproval = {
        documentId: mockDocId,
        stepIndex: 0,
        status: ApprovalStatus.PENDING,
      };

      const manager: Partial<EntityManager> = {
        findOne: jest.fn().mockResolvedValue(mockApproval),
        save: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0), // no more pending
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.approveStep(
        mockDocId,
        0,
        'Looks good',
        mockTenantId,
        mockUserId,
      );

      expect(result.status).toBe(DocumentStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ApprovalStatus.APPROVED,
          notes: 'Looks good',
        }),
      );
    });

    it('should approve step 0 but stay SUBMITTED if multi-step', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.SUBMITTED,
        documentKey: 'purchasing.po',
      } as DocumentEntity;

      const mockApproval = {
        documentId: mockDocId,
        stepIndex: 0,
        status: ApprovalStatus.PENDING,
      };

      const manager: Partial<EntityManager> = {
        findOne: jest.fn().mockResolvedValue(mockApproval),
        save: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1), // still has pending (step 1)
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.approveStep(
        mockDocId,
        0,
        null,
        mockTenantId,
        mockUserId,
      );

      expect(result.status).toBe(DocumentStatus.SUBMITTED);
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ApprovalStatus.APPROVED }),
      );
      // Should NOT transition document yet
      expect(result.approvedAt).toBeUndefined();
    });

    it('should throw if approving step 1 before step 0', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.SUBMITTED,
        documentKey: 'purchasing.po',
      } as DocumentEntity;

      const mockApproval1 = {
        documentId: mockDocId,
        stepIndex: 1,
        status: ApprovalStatus.PENDING,
      };
      const mockApproval0 = {
        documentId: mockDocId,
        stepIndex: 0,
        status: ApprovalStatus.PENDING, // NOT YET APPROVED
      };

      const manager: Partial<EntityManager> = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockApproval1)
          .mockResolvedValueOnce(mockApproval0),
        save: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      await expect(
        service.approveStep(mockDocId, 1, null, mockTenantId, mockUserId),
      ).rejects.toThrow(
        new BadRequestException(
          DOCUMENT_ERRORS.APPROVAL_STEP_NOT_READY.message,
        ),
      );
    });
  });

  describe('reject', () => {
    it('should transition document to REJECTED and update pending approvals', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.SUBMITTED,
      } as DocumentEntity;
      const manager: Partial<EntityManager> = {
        save: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.reject(
        mockDocId,
        'Not needed',
        mockTenantId,
        mockUserId,
      );

      expect(result.status).toBe(DocumentStatus.REJECTED);
      expect(result.rejectedAt).toBeDefined();
      expect(manager.update).toHaveBeenCalledWith(
        DocumentApprovalEntity,
        { documentId: mockDocId, status: ApprovalStatus.PENDING },
        expect.objectContaining({ status: ApprovalStatus.REJECTED }),
      );
    });
  });

  describe('requestRevision', () => {
    it('should transition document SUBMITTED -> REVISION_REQUESTED -> DRAFT', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.SUBMITTED,
      } as DocumentEntity;
      const manager: Partial<EntityManager> = {
        save: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.requestRevision(
        mockDocId,
        'Fix tax',
        mockTenantId,
        mockUserId,
      );

      expect(result.status).toBe(DocumentStatus.DRAFT);
      expect(result.revisionRequestedAt).toBeDefined();
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: DocumentStatus.DRAFT }),
      );
      // 2 history records: SUBMITTED -> REVISION_REQUESTED, and REVISION_REQUESTED -> DRAFT
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          toStatus: DocumentStatus.REVISION_REQUESTED,
        }),
      );
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ toStatus: DocumentStatus.DRAFT }),
      );
    });
  });

  describe('post', () => {
    it('should transition document from APPROVED to POSTED', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.APPROVED,
      } as DocumentEntity;
      const manager: Partial<EntityManager> = {
        save: jest.fn().mockResolvedValue({}),
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.post(mockDocId, mockTenantId, mockUserId);

      expect(result.status).toBe(DocumentStatus.POSTED);
      expect(result.postedAt).toBeDefined();
    });

    it('should throw if document is not APPROVED', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.DRAFT,
      } as DocumentEntity;
      const manager = {
        save: jest.fn(),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      await expect(
        service.post(mockDocId, mockTenantId, mockUserId),
      ).rejects.toThrow(
        new BadRequestException(DOCUMENT_ERRORS.INVALID_TRANSITION.message),
      );
    });
  });

  describe('cancel', () => {
    it('should transition document from APPROVED to CANCELLED', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.APPROVED,
      } as DocumentEntity;
      const manager: Partial<EntityManager> = {
        save: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn((entity: any, data: any) => data),
      };

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock(manager);

      const result = await service.cancel(
        mockDocId,
        'Mistake',
        mockTenantId,
        mockUserId,
      );

      expect(result.status).toBe(DocumentStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
      expect(manager.delete).toHaveBeenCalledWith(DocumentApprovalEntity, {
        documentId: mockDocId,
        status: ApprovalStatus.PENDING,
      });
    });
  });
});
