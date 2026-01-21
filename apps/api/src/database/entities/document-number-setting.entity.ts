import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';

@Entity('document_number_settings')
@Unique('UQ_document_number_settings_tenant_key', ['tenantId', 'documentKey'])
export class DocumentNumberSettingEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar' })
  documentKey: string;

  @Column({ type: 'varchar' })
  prefix: string;

  @Column({ type: 'int', default: 6 })
  paddingLength: number;

  @Column({ type: 'boolean', default: true })
  includePeriod: boolean;

  @Column({ type: 'varchar', default: 'yyyy-MM' })
  periodFormat: string;

  @Column({ type: 'varchar', nullable: true })
  lastPeriod: string | null;

  @Column({ type: 'int', default: 0 })
  currentCounter: number;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
