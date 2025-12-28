import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TenantTaxEntity } from './tenant-tax.entity';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';

@Entity('tenants')
export class TenantEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'DISABLED'],
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'DISABLED';

  @Column({ name: 'is_taxable', default: false })
  isTaxable: boolean;

  @Column({ name: 'is_eatery', default: false })
  isEatery: boolean;

  @OneToMany(() => TenantTaxEntity, (tenantTax) => tenantTax.tenant)
  taxes: TenantTaxEntity[];
}
