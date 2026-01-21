import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LedgerEntryType } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { DocumentEntity } from './document.entity';
import { ChartOfAccountsEntity } from './chart-of-accounts.entity';
import { CostCenterEntity } from './cost-center.entity';

@Entity('ledger_entries')
export class LedgerEntryEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({
    type: 'enum',
    enum: LedgerEntryType,
  })
  entryType: LedgerEntryType;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar' })
  accountCode: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({ type: 'varchar', default: 'IDR' })
  currencyCode: string;

  @Column({ type: 'uuid', nullable: true })
  costCenterId: string | null;

  @Column({ type: 'timestamptz' })
  postedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @ManyToOne(() => ChartOfAccountsEntity)
  @JoinColumn({ name: 'accountId' })
  account: ChartOfAccountsEntity;

  @ManyToOne(() => CostCenterEntity, { nullable: true })
  @JoinColumn({ name: 'costCenterId' })
  costCenter: CostCenterEntity | null;
}
