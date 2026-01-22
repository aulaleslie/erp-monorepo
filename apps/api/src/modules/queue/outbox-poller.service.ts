import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DocumentOutboxService } from '../documents/document-outbox.service';
import { QUEUE_NAMES, JOB_NAMES, JOB_OPTIONS } from './queue.constants';

@Injectable()
export class OutboxPollerService {
  private readonly logger = new Logger(OutboxPollerService.name);
  private isPolling = false;

  constructor(
    private readonly outboxService: DocumentOutboxService,
    @InjectQueue(QUEUE_NAMES.DOC_ENGINE)
    private readonly docEngineQueue: Queue,
  ) {}

  @Interval(5000) // Poll every 5 seconds as approved
  async handlePolling() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    try {
      const pendingEvents = await this.outboxService.getPendingEvents(50);

      if (pendingEvents.length > 0) {
        this.logger.debug(
          `Found ${pendingEvents.length} pending outbox events`,
        );

        for (const event of pendingEvents) {
          await this.docEngineQueue.add(
            JOB_NAMES.PROCESS_OUTBOX,
            {
              outboxEventId: event.id,
              tenantId: event.tenantId,
            },
            {
              ...JOB_OPTIONS,
              jobId: `outbox-${event.id}-${event.eventVersion}`, // Idempotency
            },
          );
        }

        this.logger.log(
          `Enqueued ${pendingEvents.length} jobs to ${QUEUE_NAMES.DOC_ENGINE}`,
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error during outbox polling: ${errorMessage}`,
        errorStack,
      );
    } finally {
      this.isPolling = false;
    }
  }
}
