import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

@Entity('notification_logs')
export class NotificationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar' })
  notificationType: string;

  @Column({ type: 'uuid' })
  referenceId: string;

  @Column({ type: 'integer' })
  daysBefore: number;

  @CreateDateColumn({ type: 'timestamptz' })
  sentAt: Date;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
