import { EntityManager } from 'typeorm';
import { DocumentEntity } from '../../../database/entities';

export interface PostingContext {
  document: DocumentEntity;
  manager: EntityManager;
  tenantId: string;
  userId: string;
}

export interface PostingHandler {
  post(context: PostingContext): Promise<void>;
}
