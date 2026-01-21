import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import {
  DocumentAccessScope,
  DocumentModule,
  DocumentStatus,
} from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { PeopleEntity } from './people.entity';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

@Entity('documents')
@Unique('UQ_documents_tenant_key_number', ['tenantId', 'documentKey', 'number'])
export class DocumentEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: DocumentModule,
  })
  module: DocumentModule;

  @Column({ type: 'varchar' })
  documentKey: string;

  @Column({ type: 'varchar' })
  number: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({
    type: 'enum',
    enum: DocumentAccessScope,
    default: DocumentAccessScope.TENANT,
  })
  accessScope: DocumentAccessScope;

  @Column({ type: 'uuid', nullable: true })
  accessRoleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  accessUserId: string | null;

  @Column({ type: 'timestamptz' })
  documentDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  postingDate: Date | null;

  @Column({ type: 'varchar', default: 'IDR' })
  currencyCode: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 6,
    default: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  exchangeRate: number;

  @Column({ type: 'uuid', nullable: true })
  personId: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index('IDX_documents_person_name')
  personName: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  discountTotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  taxTotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  total: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  postedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revisionRequestedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => RoleEntity, { nullable: true })
  @JoinColumn({ name: 'accessRoleId' })
  accessRole: RoleEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'accessUserId' })
  accessUser: UserEntity | null;

  @ManyToOne(() => PeopleEntity, { nullable: true })
  @JoinColumn({ name: 'personId' })
  person: PeopleEntity | null;
}
