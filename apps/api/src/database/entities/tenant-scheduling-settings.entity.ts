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

@Entity('tenant_scheduling_settings')
@Unique(['tenantId'])
export class TenantSchedulingSettingsEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'slot_duration_minutes', type: 'int', default: 60 })
  slotDurationMinutes: number;

  @Column({ name: 'booking_lead_time_hours', type: 'int', default: 0 })
  bookingLeadTimeHours: number;

  @Column({ name: 'cancellation_window_hours', type: 'int', default: 24 })
  cancellationWindowHours: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.schedulingSettings)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
