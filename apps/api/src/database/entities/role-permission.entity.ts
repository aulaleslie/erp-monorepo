import { Column, Entity, Unique } from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';

@Entity('role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermissionEntity extends BaseAuditEntity {
  @Column({ primary: true })
  roleId: string;

  @Column({ primary: true })
  permissionId: string;
}
