import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { OutboxEventKey, OutboxEventStatus } from '@gym-monorepo/shared';
import { DocumentOutboxEntity } from '../../database/entities/document-outbox.entity';

@Injectable()
export class DocumentOutboxService {
  constructor(
    @InjectRepository(DocumentOutboxEntity)
    private readonly outboxRepository: Repository<DocumentOutboxEntity>,
  ) {}

  /**
   * Get the next event version for a document + eventKey combination (max version + 1)
   */
  async getNextEventVersion(
    documentId: string,
    eventKey: OutboxEventKey,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(DocumentOutboxEntity)
      : this.outboxRepository;
    const lastEvent = await repo.findOne({
      where: { documentId, eventKey },
      order: { eventVersion: 'DESC' },
      select: ['eventVersion'],
    });

    return (lastEvent?.eventVersion || 0) + 1;
  }

  /**
   * Create an outbox event within a transaction
   */
  async createEvent(
    params: {
      tenantId: string;
      documentId: string;
      eventKey: OutboxEventKey;
      userId: string;
    },
    manager: EntityManager,
  ): Promise<DocumentOutboxEntity> {
    const eventVersion = await this.getNextEventVersion(
      params.documentId,
      params.eventKey,
      manager,
    );

    const event = manager.create(DocumentOutboxEntity, {
      ...params,
      eventVersion,
      status: OutboxEventStatus.PENDING,
      attempts: 0,
    });

    return manager.save(event);
  }

  /**
   * Mark event as processing
   */
  async markProcessing(
    eventId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(DocumentOutboxEntity)
      : this.outboxRepository;
    const result = await repo.update(eventId, {
      status: OutboxEventStatus.PROCESSING,
      attempts: () => 'attempts + 1',
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Outbox event with ID ${eventId} not found`);
    }
  }

  /**
   * Mark event as done
   */
  async markDone(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(DocumentOutboxEntity)
      : this.outboxRepository;
    const result = await repo.update(eventId, {
      status: OutboxEventStatus.DONE,
      nextAttemptAt: null,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Outbox event with ID ${eventId} not found`);
    }
  }

  /**
   * Mark event as failed with error message and schedule retry
   */
  async markFailed(
    eventId: string,
    error: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(DocumentOutboxEntity)
      : this.outboxRepository;

    // Fetch current attempts to calculate backoff
    const event = await repo.findOne({
      where: { id: eventId },
      select: ['attempts'],
    });
    if (!event) {
      throw new NotFoundException(`Outbox event with ID ${eventId} not found`);
    }

    // Exponential backoff: 1min, 2min, 4min, 8min, etc.
    const backoffMinutes = Math.pow(2, event.attempts);
    const nextAttemptAt = new Date();
    nextAttemptAt.setMinutes(nextAttemptAt.getMinutes() + backoffMinutes);

    await repo.update(eventId, {
      status: OutboxEventStatus.FAILED,
      lastError: error,
      nextAttemptAt,
    });
  }

  /**
   * Get pending events ready for processing
   */
  async getPendingEvents(limit: number = 100): Promise<DocumentOutboxEntity[]> {
    const now = new Date();
    return this.outboxRepository.find({
      where: [
        { status: OutboxEventStatus.PENDING },
        {
          status: OutboxEventStatus.FAILED,
          nextAttemptAt: LessThanOrEqual(now),
        },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
      relations: ['document'], // Optional: based on worker needs
    });
  }
}
