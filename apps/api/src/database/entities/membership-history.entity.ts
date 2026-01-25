import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import {
  MembershipHistoryAction,
  MembershipStatus,
} from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { MembershipEntity } from './membership.entity';
import { UserEntity } from './user.entity';

@Entity('membership_history')
export class MembershipHistoryEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  membershipId: string;

  @Column({
    type: 'enum',
    enum: MembershipHistoryAction,
  })
  action: MembershipHistoryAction;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    nullable: true,
  })
  fromStatus: MembershipStatus | null;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    nullable: true,
  })
  toStatus: MembershipStatus | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  performedByUserId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  performedAt: Date;

  @ManyToOne(() => MembershipEntity)
  @JoinColumn({ name: 'membershipId' })
  membership: MembershipEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'performedByUserId' })
  performedByUser: UserEntity | null;
}
