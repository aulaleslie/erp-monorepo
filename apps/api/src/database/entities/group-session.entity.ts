import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupSessionStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { MemberEntity } from './member.entity';
import { ItemEntity } from './item.entity';
import { DocumentEntity } from './document.entity';
import { DocumentItemEntity } from './document-item.entity';
import { PeopleEntity } from './people.entity';
import { GroupSessionParticipantEntity } from './group-session-participant.entity';

@Entity('group_sessions')
export class GroupSessionEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  purchaserMemberId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'varchar' })
  itemName: string;

  @Column({ type: 'uuid', nullable: true })
  sourceDocumentId: string | null;

  @Column({ type: 'uuid', nullable: true })
  sourceDocumentItemId: string | null;

  @Column({ type: 'uuid', nullable: true })
  instructorId: string | null;

  @Column({
    type: 'enum',
    enum: GroupSessionStatus,
    default: GroupSessionStatus.ACTIVE,
  })
  status: GroupSessionStatus;

  @Column({ type: 'int' })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  usedSessions: number;

  @Column({ type: 'int' })
  remainingSessions: number;

  @Column({ type: 'int' })
  maxParticipants: number;

  @Column({ type: 'date' })
  startDate: string | Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | Date | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  pricePaid: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'purchaserMemberId' })
  purchaserMember: MemberEntity;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'sourceDocumentId' })
  sourceDocument: DocumentEntity | null;

  @ManyToOne(() => DocumentItemEntity)
  @JoinColumn({ name: 'sourceDocumentItemId' })
  sourceDocumentItem: DocumentItemEntity | null;

  @ManyToOne(() => PeopleEntity)
  @JoinColumn({ name: 'instructorId' })
  instructor: PeopleEntity | null;

  @OneToMany(
    () => GroupSessionParticipantEntity,
    (participant) => participant.groupSession,
  )
  participants: GroupSessionParticipantEntity[];
}
