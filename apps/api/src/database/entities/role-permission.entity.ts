import { Column, Entity, Unique } from 'typeorm';

@Entity('role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermissionEntity {
  @Column({ primary: true })
  roleId: string;

  @Column({ primary: true })
  permissionId: string;
}
