import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingStatus, BookingType } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { MemberEntity } from './member.entity';
import { PeopleEntity } from './people.entity';
import { PtPackageEntity } from './pt-package.entity';
import { GroupSessionEntity } from './group-session.entity';

@Entity('schedule_bookings')
export class ScheduleBookingEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: BookingType,
  })
  bookingType: BookingType;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'uuid' })
  trainerId: string;

  @Column({ type: 'uuid', nullable: true })
  ptPackageId: string | null;

  @Column({ type: 'uuid', nullable: true })
  groupSessionId: string | null;

  @Column({ type: 'date' })
  bookingDate: string | Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.SCHEDULED,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  cancelledReason: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @ManyToOne(() => PeopleEntity)
  @JoinColumn({ name: 'trainerId' })
  trainer: PeopleEntity;

  @ManyToOne(() => PtPackageEntity, { nullable: true })
  @JoinColumn({ name: 'ptPackageId' })
  ptPackage: PtPackageEntity | null;

  @ManyToOne(() => GroupSessionEntity, { nullable: true })
  @JoinColumn({ name: 'groupSessionId' })
  groupSession: GroupSessionEntity | null;
}
