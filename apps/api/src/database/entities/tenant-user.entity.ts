import { Column, CreateDateColumn, Entity, Unique, PrimaryColumn } from 'typeorm';

@Entity('tenant_users')
@Unique(['tenantId', 'userId'])
export class TenantUserEntity {
  @PrimaryColumn()
  tenantId: string;

  @PrimaryColumn()
  userId: string;

  @Column()
  roleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
