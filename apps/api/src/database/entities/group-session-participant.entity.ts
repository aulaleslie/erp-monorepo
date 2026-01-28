import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupSessionEntity } from './group-session.entity';
import { MemberEntity } from './member.entity';

@Entity('group_session_participants')
export class GroupSessionParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupSessionId: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => GroupSessionEntity, (session) => session.participants)
  @JoinColumn({ name: 'groupSessionId' })
  groupSession: GroupSessionEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;
}
