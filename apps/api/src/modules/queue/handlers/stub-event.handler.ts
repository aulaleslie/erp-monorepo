import { Logger } from '@nestjs/common';
import { IEventHandler } from './event-handler.interface';
import { DocumentOutboxEntity } from '../../../database/entities/document-outbox.entity';

export class StubEventHandler implements IEventHandler {
  private readonly logger = new Logger(StubEventHandler.name);

  async handle(event: DocumentOutboxEntity): Promise<void> {
    this.logger.log(
      `[StubHandler] Processing event: ${event.eventKey} (ID: ${event.id}, Version: ${event.eventVersion})`,
    );
    // Simulate some work or just log and return
    return Promise.resolve();
  }
}
