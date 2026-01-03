import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TenantTaxEntity } from './tenant-tax.entity';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';

export enum TaxType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum TaxStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('taxes')
export class TaxEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TaxType,
    default: TaxType.PERCENTAGE,
  })
  type: TaxType;

  @Column({ type: 'numeric', precision: 10, scale: 4, nullable: true })
  rate: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  amount: number;

  @Column({
    type: 'enum',
    enum: TaxStatus,
    default: TaxStatus.ACTIVE,
  })
  status: TaxStatus;

  @OneToMany(() => TenantTaxEntity, (tenantTax) => tenantTax.tax)
  tenantTaxes: TenantTaxEntity[];
}
