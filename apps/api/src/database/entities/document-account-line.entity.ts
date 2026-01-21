import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { DocumentEntity } from './document.entity';
import { ChartOfAccountsEntity } from './chart-of-accounts.entity';
import { CostCenterEntity } from './cost-center.entity';
import { TenantEntity } from './tenant.entity';

@Entity('document_account_lines')
@Check(
  'CHK_document_account_lines_debit_credit',
  '("debitAmount" > 0 AND "creditAmount" = 0) OR ("debitAmount" = 0 AND "creditAmount" > 0)',
)
export class DocumentAccountLineEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  debitAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  creditAmount: number;

  @Column({ type: 'uuid', nullable: true })
  costCenterId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

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
