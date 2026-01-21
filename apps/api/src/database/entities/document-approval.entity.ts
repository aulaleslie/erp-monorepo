import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApprovalStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { DocumentEntity } from './document.entity';
import { UserEntity } from './user.entity';

@Entity('document_approvals')
@Index('IDX_document_approvals_document_step', ['documentId', 'stepIndex'])
export class DocumentApprovalEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'int', default: 0 })
  stepIndex: number;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'uuid' })
  requestedByUserId: string;

  @Column({ type: 'uuid', nullable: true })
  decidedByUserId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'requestedByUserId' })
  requestedByUser: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'decidedByUserId' })
  decidedByUser: UserEntity | null;
}
