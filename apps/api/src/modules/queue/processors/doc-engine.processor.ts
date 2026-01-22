import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentOutboxEntity } from '../../../database/entities/document-outbox.entity';
import { DocumentOutboxService } from '../../documents/document-outbox.service';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';
import { EventHandlerRegistry } from '../handlers/event-handler.registry';

@Processor(QUEUE_NAMES.DOC_ENGINE)
export class DocEngineProcessor extends WorkerHost {
  private readonly logger = new Logger(DocEngineProcessor.name);

  constructor(
    @InjectRepository(DocumentOutboxEntity)
    private readonly outboxRepository: Repository<DocumentOutboxEntity>,
    private readonly outboxService: DocumentOutboxService,
    private readonly handlerRegistry: EventHandlerRegistry,
  ) {
    super();
  }

  async process(
    job: Job<{ outboxEventId: string; tenantId: string }>,
  ): Promise<void> {
    if (job.name !== JOB_NAMES.PROCESS_OUTBOX) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const { outboxEventId, tenantId } = job.data;
    this.logger.debug(
      `Processing outbox event ${outboxEventId} for tenant ${tenantId}`,
    );

    const event = await this.outboxRepository.findOne({
      where: { id: outboxEventId },
    });

    if (!event) {
      this.logger.warn(`Outbox event with ID ${outboxEventId} not found`);
      return;
    }

    try {
      // Mark as processing (increments attempts)
      await this.outboxService.markProcessing(outboxEventId);

      // Execute handlers
      await this.handlerRegistry.handle(event);

      // Mark as done
      await this.outboxService.markDone(outboxEventId);
      this.logger.log(`Successfully processed event ${outboxEventId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to process event ${outboxEventId}: ${errorMessage}`,
        errorStack,
      );

      // Mark as failed (schedules retry)
      await this.outboxService.markFailed(outboxEventId, errorMessage);

      // Re-throw so BullMQ knows it failed
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
