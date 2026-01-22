import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  Repository,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  ApprovalStatus,
  DocumentAccessScope,
  DocumentModule,
  DocumentStatus,
  DOCUMENT_ERRORS,
  OUTBOX_EVENT_KEYS,
} from '@gym-monorepo/shared';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentStatusHistoryEntity,
} from '../../database/entities';
import { DocumentsService } from './documents.service';
import { DocumentNumberService } from './document-number.service';
import { DefaultPostingHandler } from './posting/default-posting-handler';
import { DocumentOutboxService } from './document-outbox.service';

jest.mock('./posting/default-posting-handler');

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepo: Repository<DocumentEntity>;
  let dataSource: DataSource;
  let documentNumberService: DocumentNumberService;
  let outboxService: DocumentOutboxService;

  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';
  const mockDocId = 'doc-1';
  const createEntity = ((
    _: EntityTarget<Record<string, unknown>>,
    data?:
      | DeepPartial<Record<string, unknown>>
      | DeepPartial<Record<string, unknown>>[],
  ) => data) as EntityManager['create'];

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
            transaction: jest.fn(
              (cb: (mgr: EntityManager) => Promise<unknown>) =>
                cb({
                  findOne: jest.fn(),
                  save: jest.fn(),
                  count: jest.fn(),
                  create: createEntity,
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
        {
          provide: DocumentOutboxService,
          useValue: {
            createEvent: jest.fn(),
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
    outboxService = module.get<DocumentOutboxService>(DocumentOutboxService);
  });

  const setupTransactionMock = (manager: Partial<EntityManager>) => {
    (dataSource.transaction as jest.Mock).mockImplementation(
      async (cb: (mgr: EntityManager) => Promise<unknown>) =>
        cb(manager as EntityManager),
    );
  };

  describe('create', () => {
    it('should create a new draft document with a generated number', async () => {
      const mockData = {
        documentDate: new Date(),
        notes: 'Test note',
      };

      const getNextDocumentNumberMock = jest
        .spyOn(documentNumberService, 'getNextDocumentNumber')
        .mockResolvedValue('INV-2026-01-000001');
      (documentRepo.create as jest.Mock).mockImplementation(
        (data: DeepPartial<DocumentEntity>) => data as DocumentEntity,
      );
      (documentRepo.save as jest.Mock).mockImplementation(
        (doc: DocumentEntity) => Promise.resolve(doc),
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
      expect(getNextDocumentNumberMock).toHaveBeenCalledWith(
        mockTenantId,
        'sales.invoice',
      );
    });

    it('should throw if document key is invalid', async () => {
      await expect(
        service.create(
          mockTenantId,
          'invalid.key',
          DocumentModule.SALES,
          {},
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(DOCUMENT_ERRORS.INVALID_DOCUMENT_TYPE.message),
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
        create: createEntity,
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
      // Outbox event
      const createEventSpy = jest.spyOn(outboxService, 'createEvent');
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_SUBMITTED,
        }),
        manager,
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
        create: createEntity,
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
        create: createEntity,
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
      // Outbox event
      const createEventSpy = jest.spyOn(outboxService, 'createEvent');
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_APPROVED,
        }),
        manager,
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
        create: createEntity,
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
        create: createEntity,
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
        create: createEntity,
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
      // Outbox event
      const createEventSpy = jest.spyOn(outboxService, 'createEvent');
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_REJECTED,
        }),
        manager,
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
        create: createEntity,
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
      // Outbox event
      const createEventSpy = jest.spyOn(outboxService, 'createEvent');
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_REVISION_REQUESTED,
        }),
        manager,
      );
    });
  });

  describe('post', () => {
    it('should call posting handler and transition document from APPROVED to POSTED', async () => {
      const mockDoc = {
        id: mockDocId,
        status: DocumentStatus.APPROVED,
        documentKey: 'sales.invoice',
      } as DocumentEntity;

      const postMock = jest.fn().mockResolvedValue(undefined);
      (DefaultPostingHandler as jest.Mock).mockImplementation(() => ({
        post: postMock,
      }));

      (documentRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);
      setupTransactionMock({
        findOne: jest.fn().mockResolvedValue(mockDoc),
        save: jest.fn().mockResolvedValue({}),
        create: createEntity,
      });

      const result = await service.post(mockDocId, mockTenantId, mockUserId);

      expect(postMock).toHaveBeenCalled();
      expect(result.id).toBe(mockDocId);
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
        create: createEntity,
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
      // Outbox event
      const createEventSpy = jest.spyOn(outboxService, 'createEvent');
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_CANCELLED,
        }),
        manager,
      );
    });
  });

  describe('Row-level Access Rules', () => {
    describe('findOne access scope enforcement', () => {
      it('should return document when accessScope is TENANT', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          accessScope: DocumentAccessScope.TENANT,
        } as DocumentEntity;
        (documentRepo.findOne as jest.Mock).mockResolvedValue(doc);

        const result = await service.findOne(
          mockDocId,
          mockTenantId,
          mockUserId,
        );
        expect(result).toEqual(doc);
      });

      it('should return document when accessScope is CREATOR and user is creator', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          accessScope: DocumentAccessScope.CREATOR,
          createdBy: mockUserId,
        } as DocumentEntity;
        (documentRepo.findOne as jest.Mock).mockResolvedValue(doc);

        const result = await service.findOne(
          mockDocId,
          mockTenantId,
          mockUserId,
        );
        expect(result).toEqual(doc);
      });

      it('should throw ForbiddenException when accessScope is CREATOR and user is NOT creator', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          accessScope: DocumentAccessScope.CREATOR,
          createdBy: 'other-user',
        } as DocumentEntity;
        (documentRepo.findOne as jest.Mock).mockResolvedValue(doc);

        await expect(
          service.findOne(mockDocId, mockTenantId, mockUserId),
        ).rejects.toThrow(DOCUMENT_ERRORS.ACCESS_DENIED.message);
      });

      it('should allow access when accessScope is ROLE (reserved for future)', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          accessScope: DocumentAccessScope.ROLE,
          accessRoleId: 'some-role',
        } as DocumentEntity;
        (documentRepo.findOne as jest.Mock).mockResolvedValue(doc);

        const result = await service.findOne(
          mockDocId,
          mockTenantId,
          mockUserId,
        );
        expect(result).toEqual(doc);
      });

      it('should allow access when accessScope is USER (reserved for future)', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          accessScope: DocumentAccessScope.USER,
          accessUserId: 'some-user',
        } as DocumentEntity;
        (documentRepo.findOne as jest.Mock).mockResolvedValue(doc);

        const result = await service.findOne(
          mockDocId,
          mockTenantId,
          mockUserId,
        );
        expect(result).toEqual(doc);
      });
    });

    describe('workflow methods context passing', () => {
      it('should pass userId to findOne in submit', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          status: DocumentStatus.DRAFT,
          module: DocumentModule.SALES,
        } as DocumentEntity;
        const findOneSpy = jest
          .spyOn(service, 'findOne')
          .mockResolvedValue(doc);

        setupTransactionMock({
          save: jest.fn().mockResolvedValue({}),
          count: jest.fn().mockResolvedValue(1),
          create: createEntity,
        });

        await service.submit(mockDocId, mockTenantId, mockUserId);
        expect(findOneSpy).toHaveBeenCalledWith(
          mockDocId,
          mockTenantId,
          mockUserId,
        );
      });

      it('should pass userId to findOne in approveStep', async () => {
        const doc = {
          id: mockDocId,
          tenantId: mockTenantId,
          status: DocumentStatus.SUBMITTED,
          documentKey: 'sales.invoice',
        } as DocumentEntity;
        const findOneSpy = jest
          .spyOn(service, 'findOne')
          .mockResolvedValue(doc);
        const mockApproval = { status: ApprovalStatus.PENDING };

        setupTransactionMock({
          findOne: jest.fn().mockResolvedValue(mockApproval),
          save: jest.fn().mockResolvedValue({}),
          count: jest.fn().mockResolvedValue(0),
          create: createEntity,
        });

        await service.approveStep(mockDocId, 0, null, mockTenantId, mockUserId);
        expect(findOneSpy).toHaveBeenCalledWith(
          mockDocId,
          mockTenantId,
          mockUserId,
        );
      });
    });
  });
});
