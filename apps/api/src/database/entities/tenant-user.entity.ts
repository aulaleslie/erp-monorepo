import { Column, Entity, Unique, PrimaryColumn } from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';

@Entity('tenant_users')
@Unique(['tenantId', 'userId'])
export class TenantUserEntity extends BaseAuditEntity {
  @PrimaryColumn()
  tenantId: string;

  @PrimaryColumn()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  roleId: string | null;
}
