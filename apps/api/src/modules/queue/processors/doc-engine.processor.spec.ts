import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { DocumentOutboxEntity } from '../../../database/entities/document-outbox.entity';
import { DocumentOutboxService } from '../../documents/document-outbox.service';
import { DocEngineProcessor } from './doc-engine.processor';
import { EventHandlerRegistry } from '../handlers/event-handler.registry';
import { JOB_NAMES } from '../queue.constants';

describe('DocEngineProcessor', () => {
  let processor: DocEngineProcessor;
  let outboxRepository: Repository<DocumentOutboxEntity>;
  let outboxService: DocumentOutboxService;
  let handlerRegistry: EventHandlerRegistry;

  const mockOutboxEvent = {
    id: 'event-1',
    tenantId: 'tenant-1',
    eventKey: 'document.submitted',
    eventVersion: 1,
  } as DocumentOutboxEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocEngineProcessor,
        {
          provide: getRepositoryToken(DocumentOutboxEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DocumentOutboxService,
          useValue: {
            markProcessing: jest.fn(),
            markDone: jest.fn(),
            markFailed: jest.fn(),
          },
        },
        {
          provide: EventHandlerRegistry,
          useValue: {
            handle: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<DocEngineProcessor>(DocEngineProcessor);
    outboxRepository = module.get(getRepositoryToken(DocumentOutboxEntity));
    outboxService = module.get<DocumentOutboxService>(DocumentOutboxService);
    handlerRegistry = module.get<EventHandlerRegistry>(EventHandlerRegistry);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process job successfully and mark event as DONE', async () => {
      const job = {
        name: JOB_NAMES.PROCESS_OUTBOX,
        data: { outboxEventId: 'event-1', tenantId: 'tenant-1' },
      } as unknown as Job<{ outboxEventId: string; tenantId: string }>;

      jest
        .spyOn(outboxRepository, 'findOne')
        .mockResolvedValue(mockOutboxEvent);
      const markProcessingSpy = jest.spyOn(outboxService, 'markProcessing');
      const handleSpy = jest.spyOn(handlerRegistry, 'handle');
      const markDoneSpy = jest.spyOn(outboxService, 'markDone');

      await processor.process(
        job as unknown as Job<{ outboxEventId: string; tenantId: string }>,
      );

      expect(markProcessingSpy).toHaveBeenCalledWith('event-1');
      expect(handleSpy).toHaveBeenCalledWith(mockOutboxEvent);
      expect(markDoneSpy).toHaveBeenCalledWith('event-1');
    });

    it('should ignore jobs with unknown names', async () => {
      const job = {
        name: 'unknown-job',
        data: { outboxEventId: 'event-1', tenantId: 'tenant-1' },
      } as unknown as Job<{ outboxEventId: string; tenantId: string }>;

      const findOneSpy = jest.spyOn(outboxRepository, 'findOne');
      await processor.process(
        job as unknown as Job<{ outboxEventId: string; tenantId: string }>,
      );
      expect(findOneSpy).not.toHaveBeenCalled();
    });

    it('should handle missing outbox events gracefully', async () => {
      const job = {
        name: JOB_NAMES.PROCESS_OUTBOX,
        data: { outboxEventId: 'missing-id', tenantId: 'tenant-1' },
      } as unknown as Job<{ outboxEventId: string; tenantId: string }>;

      jest.spyOn(outboxRepository, 'findOne').mockResolvedValue(null);
      const markProcessingSpy = jest.spyOn(outboxService, 'markProcessing');

      await processor.process(
        job as unknown as Job<{ outboxEventId: string; tenantId: string }>,
      );
      expect(markProcessingSpy).not.toHaveBeenCalled();
    });

    it('should mark event as FAILED when handler throws', async () => {
      const job = {
        name: JOB_NAMES.PROCESS_OUTBOX,
        data: { outboxEventId: 'event-1', tenantId: 'tenant-1' },
      } as unknown as Job<{ outboxEventId: string; tenantId: string }>;

      const error = new Error('Handler failed');
      jest
        .spyOn(outboxRepository, 'findOne')
        .mockResolvedValue(mockOutboxEvent);
      jest.spyOn(handlerRegistry, 'handle').mockRejectedValue(error);
      const markFailedSpy = jest.spyOn(outboxService, 'markFailed');

      await expect(
        processor.process(
          job as unknown as Job<{ outboxEventId: string; tenantId: string }>,
        ),
      ).rejects.toThrow('Handler failed');
      expect(markFailedSpy).toHaveBeenCalledWith('event-1', 'Handler failed');
    });
  });
});
