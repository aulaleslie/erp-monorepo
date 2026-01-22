import { EntityManager } from 'typeorm';
import { DocumentEntity } from '../../../database/entities';
import { DocumentOutboxService } from '../document-outbox.service';

export interface PostingContext {
  document: DocumentEntity;
  manager: EntityManager;
  tenantId: string;
  userId: string;
  outboxService: DocumentOutboxService;
}

export interface PostingHandler {
  post(context: PostingContext): Promise<void>;
}
