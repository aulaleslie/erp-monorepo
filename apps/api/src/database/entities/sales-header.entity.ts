import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalesTaxPricingMode } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { DocumentEntity } from './document.entity';
import { PeopleEntity } from './people.entity';

@Entity('sales_headers')
export class SalesHeaderEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid', nullable: true })
  salespersonPersonId: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalRef: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentTerms: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryDate: Date | null;

  @Column({
    type: 'enum',
    enum: SalesTaxPricingMode,
  })
  taxPricingMode: SalesTaxPricingMode;

  @Column({ type: 'text', nullable: true })
  billingAddressSnapshot: string | null;

  @Column({ type: 'text', nullable: true })
  shippingAddressSnapshot: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @OneToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @ManyToOne(() => PeopleEntity, { nullable: true })
  @JoinColumn({ name: 'salespersonPersonId' })
  salesperson: PeopleEntity | null;
}
