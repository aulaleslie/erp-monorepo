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

@Entity('tenant_themes')
@Unique(['tenantId'])
export class TenantThemeEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  presetId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.theme)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
