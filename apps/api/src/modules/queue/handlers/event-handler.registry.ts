import { Injectable, Logger } from '@nestjs/common';
import { OutboxEventKey } from '@gym-monorepo/shared';
import { IEventHandler, EventHandlerMap } from './event-handler.interface';
import { StubEventHandler } from './stub-event.handler';
import { DocumentOutboxEntity } from '../../../database/entities/document-outbox.entity';

@Injectable()
export class EventHandlerRegistry {
  private readonly logger = new Logger(EventHandlerRegistry.name);
  private readonly handlers: EventHandlerMap = {};
  private readonly fallbackHandler = new StubEventHandler();

  constructor() {
    // We can register handlers here or provide a register method
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers() {
    // This cycle uses stubs for all documented events
    // Actual handlers will be registered as modules are implemented
    this.logger.debug('Initializing EventHandlerRegistry with stubs');
  }

  async handle(event: DocumentOutboxEntity): Promise<void> {
    const handler =
      this.handlers[event.eventKey as OutboxEventKey] || this.fallbackHandler;

    if (handler === this.fallbackHandler) {
      this.logger.debug(
        `No specific handler for ${event.eventKey}, using fallback`,
      );
    }

    await handler.handle(event);
  }

  registerHandler(eventKey: OutboxEventKey, handler: IEventHandler) {
    this.logger.log(`Registering handler for event: ${eventKey}`);
    this.handlers[eventKey] = handler;
  }
}
