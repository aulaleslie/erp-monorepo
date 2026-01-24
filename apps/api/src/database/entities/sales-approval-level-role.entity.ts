import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalesApprovalLevelEntity } from './sales-approval-level.entity';
import { RoleEntity } from './role.entity';

@Entity('sales_approval_level_roles')
export class SalesApprovalLevelRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  salesApprovalLevelId: string;

  @ManyToOne(() => SalesApprovalLevelEntity, (level) => level.roles)
  @JoinColumn({ name: 'salesApprovalLevelId' })
  level: SalesApprovalLevelEntity;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'roleId' })
  role: RoleEntity;
}
