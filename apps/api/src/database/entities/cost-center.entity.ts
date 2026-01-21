import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';

@Entity('cost_centers')
@Unique('UQ_cost_centers_tenant_code', ['tenantId', 'code'])
export class CostCenterEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
