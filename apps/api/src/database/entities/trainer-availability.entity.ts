import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { PeopleEntity } from './people.entity';
import { TenantEntity } from './tenant.entity';

@Entity('trainer_availability')
@Unique('UQ_trainer_availability_slot', [
  'tenantId',
  'trainerId',
  'dayOfWeek',
  'startTime',
])
@Check(`"startTime" < "endTime"`)
export class TrainerAvailabilityEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  trainerId: string;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => PeopleEntity)
  @JoinColumn({ name: 'trainerId' })
  trainer: PeopleEntity;
}
