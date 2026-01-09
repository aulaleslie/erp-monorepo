import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { DepartmentStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from '../../database/entities';

@Entity('departments')
@Unique('UQ_departments_tenant_code', ['tenantId', 'code'])
@Index('UQ_departments_tenant_name', ['tenantId', 'name'], {
  unique: true,
  where: '"name" IS NOT NULL',
})
export class DepartmentEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DepartmentStatus,
    default: DepartmentStatus.ACTIVE,
  })
  status: DepartmentStatus;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
