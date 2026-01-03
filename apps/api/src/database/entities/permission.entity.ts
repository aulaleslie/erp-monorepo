import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';

@Entity('permissions')
export class PermissionEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g. roles.read

  @Column()
  name: string;

  @Column()
  group: string; // e.g. Tenant, Roles, Users
}
