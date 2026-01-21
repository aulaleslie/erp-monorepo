import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AccountType } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';

@Entity('chart_of_accounts')
@Unique('UQ_chart_of_accounts_tenant_code', ['tenantId', 'code'])
export class ChartOfAccountsEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type: AccountType;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => ChartOfAccountsEntity, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: ChartOfAccountsEntity | null;
}
