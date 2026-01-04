import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TenantType, Locale } from '@gym-monorepo/shared';
import { TenantTaxEntity } from './tenant-tax.entity';
import { TenantThemeEntity } from './tenant-theme.entity';
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

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.GYM,
  })
  type: TenantType;

  @Column({
    type: 'enum',
    enum: Locale,
    default: Locale.EN,
  })
  language: Locale;

  @Column({ name: 'is_taxable', default: false })
  isTaxable: boolean;

  @OneToMany(() => TenantTaxEntity, (tenantTax) => tenantTax.tenant)
  taxes: TenantTaxEntity[];

  @OneToMany(() => TenantThemeEntity, (tenantTheme) => tenantTheme.tenant)
  theme: TenantThemeEntity[];
}
