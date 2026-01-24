import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import type { SalesApprovalLevelRoleEntity } from './sales-approval-level-role.entity';

@Entity('sales_approval_levels')
export class SalesApprovalLevelEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column({ type: 'varchar' })
  documentKey: string;

  @Column({ type: 'int' })
  levelIndex: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany('SalesApprovalLevelRoleEntity', 'level')
  roles: SalesApprovalLevelRoleEntity[];
}
