import { BadRequestException } from '@nestjs/common';
import {
  DocumentStatus,
  DOCUMENT_ERRORS,
  LedgerEntryType,
  OUTBOX_EVENT_KEYS,
} from '@gym-monorepo/shared';
import { EntityManager } from 'typeorm';
import {
  ChartOfAccountsEntity,
  DocumentEntity,
  DocumentStatusHistoryEntity,
  LedgerEntryEntity,
} from '../../../database/entities';
import { BasePostingHandler } from './base-posting-handler';
import { DefaultPostingHandler } from './default-posting-handler';
import { PostingContext } from './posting-handler.interface';
import { DocumentOutboxService } from '../document-outbox.service';

// Concrete implementation of BasePostingHandler for testing
class TestPostingHandler extends BasePostingHandler {
  protected async executePosting(_context: PostingContext): Promise<void> {
    // Mock posting logic
  }
}

describe('PostingHandlers', () => {
  let mockManager: Partial<EntityManager>;
  let mockDocument: Partial<DocumentEntity>;
  let mockOutboxService: Partial<DocumentOutboxService>;
  let context: PostingContext;

  beforeEach(() => {
    mockDocument = {
      id: 'doc-1',
      status: DocumentStatus.APPROVED,
      total: 1000,
      currencyCode: 'IDR',
    };

    mockManager = {
      save: jest
        .fn()
        .mockImplementation(<T>(entity: T) => Promise.resolve(entity)),
      create: jest
        .fn()
        .mockImplementation((_cls: unknown, data: Record<string, unknown>) => ({
          ...data,
        })),
      findOne: jest.fn(),
    };

    mockOutboxService = {
      createEvent: jest.fn().mockResolvedValue({}),
    };

    context = {
      document: mockDocument as DocumentEntity,
      manager: mockManager as EntityManager,
      tenantId: 'tenant-1',
      userId: 'user-1',
      outboxService: mockOutboxService as DocumentOutboxService,
    };
  });

  describe('BasePostingHandler', () => {
    let handler: TestPostingHandler;

    beforeEach(() => {
      handler = new TestPostingHandler();
    });

    it('should throw if document status is already POSTED', async () => {
      mockDocument.status = DocumentStatus.POSTED;
      await expect(handler.post(context)).rejects.toThrow(
        new BadRequestException(
          DOCUMENT_ERRORS.POSTING_ALREADY_PROCESSED.message,
        ),
      );
    });

    it('should throw if document status is not APPROVED', async () => {
      mockDocument.status = DocumentStatus.DRAFT;
      await expect(handler.post(context)).rejects.toThrow(
        new BadRequestException(DOCUMENT_ERRORS.INVALID_TRANSITION.message),
      );
    });

    it('should transition document to POSTED and save', async () => {
      await handler.post(context);
      expect(mockDocument.status).toBe(DocumentStatus.POSTED);
      expect(mockDocument.postedAt).toBeDefined();
      expect(mockManager.save).toHaveBeenCalledWith(mockDocument);
    });

    it('should record status history', async () => {
      await handler.post(context);
      expect(mockManager.create).toHaveBeenCalledWith(
        DocumentStatusHistoryEntity,
        expect.objectContaining({
          fromStatus: DocumentStatus.APPROVED,
          toStatus: DocumentStatus.POSTED,
        }),
      );
    });

    it('should trigger document.posted outbox event', async () => {
      const createEventSpy = jest.spyOn(mockOutboxService, 'createEvent');
      await handler.post(context);
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_POSTED,
        }),
        mockManager,
      );
    });
  });

  describe('DefaultPostingHandler', () => {
    let handler: DefaultPostingHandler;

    beforeEach(() => {
      handler = new DefaultPostingHandler();

      // Mock finding COA
      (mockManager.findOne as jest.Mock).mockImplementation(
        (cls: any, opts: { where: { code: string } }) => {
          if (cls === ChartOfAccountsEntity) {
            const code = opts.where.code;
            return Promise.resolve({ id: `coa-${code}`, code });
          }
          return Promise.resolve(null);
        },
      );
    });

    it('should create debit and credit ledger entries', async () => {
      await handler.post(context);

      // Verify two ledger entries were created and saved
      expect(mockManager.create).toHaveBeenCalledWith(
        LedgerEntryEntity,
        expect.objectContaining({
          entryType: LedgerEntryType.DEBIT,
          accountCode: '1000',
          amount: 1000,
        }),
      );

      expect(mockManager.create).toHaveBeenCalledWith(
        LedgerEntryEntity,
        expect.objectContaining({
          entryType: LedgerEntryType.CREDIT,
          accountCode: '4000',
          amount: 1000,
        }),
      );

      // check number of saves for LedgerEntryEntity
      // 1 for document, 2 for ledger entries, 1 for history = 4 total saves
      expect(mockManager.save).toHaveBeenCalledTimes(4);
    });

    it('should trigger module-specific outbox events for sales invoice', async () => {
      mockDocument.documentKey = 'sales.invoice';
      const createEventSpy = jest.spyOn(mockOutboxService, 'createEvent');
      await handler.post(context);

      // Should call for generic document.posted AND specific sales.invoice.posted
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.DOCUMENT_POSTED,
        }),
        mockManager,
      );
      expect(createEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: OUTBOX_EVENT_KEYS.SALES_INVOICE_POSTED,
        }),
        mockManager,
      );
    });
  });
});
