import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DocumentOutboxService } from '../documents/document-outbox.service';
import { OutboxPollerService } from './outbox-poller.service';
import { QUEUE_NAMES, JOB_NAMES } from './queue.constants';
import { DocumentOutboxEntity } from '../../database/entities/document-outbox.entity';

describe('OutboxPollerService', () => {
  let service: OutboxPollerService;
  let outboxService: DocumentOutboxService;
  let queue: Queue;

  const mockEvents = [
    { id: '1', tenantId: 't1', eventVersion: 1 },
    { id: '2', tenantId: 't1', eventVersion: 2 },
  ] as unknown as DocumentOutboxEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxPollerService,
        {
          provide: DocumentOutboxService,
          useValue: {
            getPendingEvents: jest.fn(),
          },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.DOC_ENGINE),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OutboxPollerService>(OutboxPollerService);
    outboxService = module.get<DocumentOutboxService>(DocumentOutboxService);
    queue = module.get<Queue>(getQueueToken(QUEUE_NAMES.DOC_ENGINE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handlePolling', () => {
    it('should enqueue jobs for pending events', async () => {
      jest
        .spyOn(outboxService, 'getPendingEvents')
        .mockResolvedValue(mockEvents);
      const addSpy = jest.spyOn(queue, 'add');

      await service.handlePolling();

      expect(addSpy).toHaveBeenCalledTimes(2);
      expect(addSpy).toHaveBeenCalledWith(
        JOB_NAMES.PROCESS_OUTBOX,
        { outboxEventId: '1', tenantId: 't1' },
        expect.objectContaining({
          jobId: 'outbox-1-1',
        }),
      );
      expect(addSpy).toHaveBeenCalledWith(
        JOB_NAMES.PROCESS_OUTBOX,
        { outboxEventId: '2', tenantId: 't1' },
        expect.objectContaining({
          jobId: 'outbox-2-2',
        }),
      );
    });

    it('should skip polling if already in progress', async () => {
      // Use a promise that doesn't resolve immediately to keep it "in progress"
      let resolveFirstCall: (value: any) => void;
      const firstCallPromise = new Promise((resolve) => {
        resolveFirstCall = resolve;
      });

      const getPendingSpy = jest
        .spyOn(outboxService, 'getPendingEvents')
        .mockReturnValue(
          firstCallPromise as unknown as Promise<DocumentOutboxEntity[]>,
        );

      // Start first call
      const firstCall = service.handlePolling();

      // Start second call immediately
      await service.handlePolling();

      expect(getPendingSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      resolveFirstCall!([]);
      await firstCall;
    });

    it('should handle errors gracefully during polling', async () => {
      jest
        .spyOn(outboxService, 'getPendingEvents')
        .mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(service.handlePolling()).resolves.not.toThrow();
    });
  });
});
