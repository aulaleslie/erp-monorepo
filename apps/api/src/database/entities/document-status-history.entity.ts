import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentStatus } from '@gym-monorepo/shared';
import { DocumentEntity } from './document.entity';
import { UserEntity } from './user.entity';

@Entity('document_status_history')
export class DocumentStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
  })
  fromStatus: DocumentStatus;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
  })
  toStatus: DocumentStatus;

  @Column({ type: 'uuid' })
  changedByUserId: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  changedAt: Date;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'changedByUserId' })
  changedByUser: UserEntity;
}
