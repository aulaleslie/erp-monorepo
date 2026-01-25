import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { OverrideType } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { PeopleEntity } from './people.entity';
import { TenantEntity } from './tenant.entity';

@Entity('trainer_availability_overrides')
@Unique('UQ_trainer_availability_override', [
  'tenantId',
  'trainerId',
  'date',
  'overrideType',
  'startTime',
])
export class TrainerAvailabilityOverrideEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  trainerId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: OverrideType,
    enumName: 'trainer_availability_override_type_enum',
  })
  overrideType: OverrideType;

  @Column({ type: 'time', nullable: true })
  startTime: string | null;

  @Column({ type: 'time', nullable: true })
  endTime: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => PeopleEntity)
  @JoinColumn({ name: 'trainerId' })
  trainer: PeopleEntity;
}
