import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AttendanceType, CheckInMethod } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { MemberEntity } from './member.entity';
import { ScheduleBookingEntity } from './schedule-booking.entity';
import { UserEntity } from './user.entity';

@Entity('attendance_records')
export class AttendanceRecordEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({
    type: 'enum',
    enum: AttendanceType,
  })
  attendanceType: AttendanceType;

  @Column({ type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ type: 'timestamptz' })
  checkInAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checkOutAt: Date | null;

  @Column({
    type: 'enum',
    enum: CheckInMethod,
  })
  checkInMethod: CheckInMethod;

  @Column({ type: 'uuid', nullable: true })
  checkedInByUserId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @ManyToOne(() => ScheduleBookingEntity, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: ScheduleBookingEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'checkedInByUserId' })
  checkedInByUser: UserEntity | null;
}
