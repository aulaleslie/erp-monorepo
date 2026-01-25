import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PtPackageStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { MemberEntity } from './member.entity';
import { ItemEntity } from './item.entity';
import { DocumentEntity } from './document.entity';
import { DocumentItemEntity } from './document-item.entity';
import { MembershipEntity } from './membership.entity';
import { PeopleEntity } from './people.entity';

@Entity('pt_session_packages')
export class PtPackageEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'varchar' })
  itemName: string;

  @Column({ type: 'uuid', nullable: true })
  sourceDocumentId: string | null;

  @Column({ type: 'uuid', nullable: true })
  sourceDocumentItemId: string | null;

  @Column({ type: 'uuid', nullable: true })
  sourceMembershipId: string | null;

  @Column({ type: 'uuid', nullable: true })
  preferredTrainerId: string | null;

  @Column({
    type: 'enum',
    enum: PtPackageStatus,
    default: PtPackageStatus.ACTIVE,
  })
  status: PtPackageStatus;

  @Column({ type: 'int' })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  usedSessions: number;

  @Column({ type: 'int' })
  remainingSessions: number;

  @Column({ type: 'date' })
  startDate: string | Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | Date | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  pricePaid: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  requiresReview: boolean;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'sourceDocumentId' })
  sourceDocument: DocumentEntity | null;

  @ManyToOne(() => DocumentItemEntity)
  @JoinColumn({ name: 'sourceDocumentItemId' })
  sourceDocumentItem: DocumentItemEntity | null;

  @ManyToOne(() => MembershipEntity)
  @JoinColumn({ name: 'sourceMembershipId' })
  sourceMembership: MembershipEntity | null;

  @ManyToOne(() => PeopleEntity)
  @JoinColumn({ name: 'preferredTrainerId' })
  preferredTrainer: PeopleEntity | null;
}
