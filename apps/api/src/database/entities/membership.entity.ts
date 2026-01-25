import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemDurationUnit, MembershipStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { MemberEntity } from './member.entity';
import { ItemEntity } from './item.entity';
import { DocumentEntity } from './document.entity';
import { DocumentItemEntity } from './document-item.entity';

@Entity('memberships')
export class MembershipEntity extends BaseAuditEntity {
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

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE,
  })
  status: MembershipStatus;

  @Column({ type: 'date' })
  startDate: string | Date;

  @Column({ type: 'date' })
  endDate: string | Date;

  @Column({ type: 'int' })
  durationValue: number;

  @Column({
    type: 'enum',
    enum: ItemDurationUnit,
  })
  durationUnit: ItemDurationUnit;

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

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  cancelledReason: string | null;

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
}
