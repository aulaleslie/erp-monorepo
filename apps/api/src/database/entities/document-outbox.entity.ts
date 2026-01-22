import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { OutboxEventStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { DocumentEntity } from './document.entity';

@Entity('document_outbox')
@Unique('UQ_document_outbox_idempotency', [
  'documentId',
  'eventKey',
  'eventVersion',
])
export class DocumentOutboxEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'varchar' })
  eventKey: string;

  @Column({ type: 'int', default: 1 })
  eventVersion: number;

  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  @Index('IDX_document_outbox_status_next_attempt')
  status: OutboxEventStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  @Index('IDX_document_outbox_status_next_attempt')
  nextAttemptAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;
}
