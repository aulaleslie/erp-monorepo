import { OutboxEventKey } from '@gym-monorepo/shared';
import { DocumentOutboxEntity } from '../../../database/entities/document-outbox.entity';

export interface IEventHandler {
  handle(event: DocumentOutboxEntity): Promise<void>;
}

export type EventHandlerMap = Partial<Record<OutboxEventKey, IEventHandler>>;
