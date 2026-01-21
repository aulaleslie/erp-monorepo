import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { DocumentEntity } from './document.entity';
import { DocumentItemEntity } from './document-item.entity';
import { TenantEntity } from './tenant.entity';
import { TaxEntity } from './tax.entity';

@Entity('document_tax_lines')
export class DocumentTaxLineEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid', nullable: true })
  documentItemId: string | null;

  @Column({ type: 'uuid', nullable: true })
  taxId: string | null;

  @Column({ type: 'varchar' })
  taxName: string;

  @Column({ type: 'varchar' })
  taxType: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  taxRate: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  taxAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  taxableBase: number;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @ManyToOne(() => DocumentItemEntity, { nullable: true })
  @JoinColumn({ name: 'documentItemId' })
  documentItem: DocumentItemEntity | null;

  @ManyToOne(() => TaxEntity, { nullable: true })
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity | null;
}
