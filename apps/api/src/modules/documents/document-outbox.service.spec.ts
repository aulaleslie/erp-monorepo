import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OutboxEventKey, OutboxEventStatus } from '@gym-monorepo/shared';
import { DocumentOutboxEntity } from '../../database/entities/document-outbox.entity';
import { DocumentOutboxService } from './document-outbox.service';

describe('DocumentOutboxService', () => {
  let service: DocumentOutboxService;
  let repository: Repository<DocumentOutboxEntity>;

  const mockOutboxEntity = {
    id: 'outbox-1',
    tenantId: 'tenant-1',
    documentId: 'doc-1',
    eventKey: 'document.submitted',
    eventVersion: 1,
    status: OutboxEventStatus.PENDING,
    attempts: 0,
  } as DocumentOutboxEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentOutboxService,
        {
          provide: getRepositoryToken(DocumentOutboxEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentOutboxService>(DocumentOutboxService);
    repository = module.get(getRepositoryToken(DocumentOutboxEntity));
    repository = module.get(getRepositoryToken(DocumentOutboxEntity));
  });

  describe('getNextEventVersion', () => {
    it('should return 1 when no events exist for document + eventKey', async () => {
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      const version = await service.getNextEventVersion(
        'doc-1',
        'document.submitted' as OutboxEventKey,
      );
      expect(version).toBe(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { documentId: 'doc-1', eventKey: 'document.submitted' },
        order: { eventVersion: 'DESC' },
        select: ['eventVersion'],
      });
    });

    it('should return max + 1 when events exist', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue({ eventVersion: 5 } as DocumentOutboxEntity);

      const version = await service.getNextEventVersion(
        'doc-1',
        'document.submitted' as OutboxEventKey,
      );
      expect(version).toBe(6);
    });

    it('should use provided EntityManager when given', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({ eventVersion: 2 }),
        }),
      } as unknown as EntityManager;

      const version = await service.getNextEventVersion(
        'doc-1',
        'document.submitted' as OutboxEventKey,
        mockManager,
      );
      expect(version).toBe(3);
      const getRepositorySpy = jest.spyOn(mockManager, 'getRepository');
      expect(getRepositorySpy).toHaveBeenCalledWith(DocumentOutboxEntity);
    });
  });

  describe('createEvent', () => {
    it('should create and save a new outbox event', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
        create: jest.fn().mockReturnValue(mockOutboxEntity),
        save: jest.fn().mockResolvedValue(mockOutboxEntity),
      } as unknown as EntityManager;

      const params = {
        tenantId: 'tenant-1',
        documentId: 'doc-1',
        eventKey: 'document.submitted' as OutboxEventKey,
        userId: 'user-1',
      };

      const createSpy = jest.spyOn(mockManager, 'create');
      const saveSpy = jest.spyOn(mockManager, 'save');

      const result = await service.createEvent(params, mockManager);

      expect(result).toEqual(mockOutboxEntity);
      expect(createSpy).toHaveBeenCalledWith(DocumentOutboxEntity, {
        ...params,
        eventVersion: 1,
        status: OutboxEventStatus.PENDING,
        attempts: 0,
      });
      expect(saveSpy).toHaveBeenCalledWith(mockOutboxEntity);
    });
  });

  describe('markProcessing', () => {
    it('should update status to PROCESSING and increment attempts', async () => {
      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.markProcessing('outbox-1');
      expect(updateSpy).toHaveBeenCalledWith('outbox-1', {
        status: OutboxEventStatus.PROCESSING,
        attempts: expect.any(Function) as unknown,
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(service.markProcessing('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markDone', () => {
    it('should update status to DONE and clear nextAttemptAt', async () => {
      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.markDone('outbox-1');
      expect(updateSpy).toHaveBeenCalledWith('outbox-1', {
        status: OutboxEventStatus.DONE,
        nextAttemptAt: null,
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(service.markDone('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markFailed', () => {
    it('should update status to FAILED and set nextAttemptAt with backoff', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-22T08:00:00Z'));

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue({ attempts: 2 } as DocumentOutboxEntity);
      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.markFailed('outbox-1', 'Connection timeout');

      // attempts 2 -> 2^2 = 4 minutes backoff
      const expectedNextAttempt = new Date('2026-01-22T08:04:00Z');

      expect(updateSpy).toHaveBeenCalledWith('outbox-1', {
        status: OutboxEventStatus.FAILED,
        lastError: 'Connection timeout',
        nextAttemptAt: expectedNextAttempt,
      });

      jest.useRealTimers();
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.markFailed('invalid-id', 'err')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPendingEvents', () => {
    it('should find PENDING events or FAILED events that are due', async () => {
      const mockEvents = [mockOutboxEntity];
      const findSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue(mockEvents);

      const results = await service.getPendingEvents(10);

      expect(results).toEqual(mockEvents);
      expect(findSpy).toHaveBeenCalledWith({
        where: [
          { status: OutboxEventStatus.PENDING },
          {
            status: OutboxEventStatus.FAILED,
            nextAttemptAt: expect.anything() as unknown,
          },
        ],
        order: { createdAt: 'ASC' },
        take: 10,
        relations: ['document'],
      });
    });
  });
});
