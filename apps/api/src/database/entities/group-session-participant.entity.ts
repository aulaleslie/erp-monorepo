import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { GroupSessionEntity } from './group-session.entity';
import { MemberEntity } from './member.entity';

@Entity('group_session_participants')
export class GroupSessionParticipantEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupSessionId: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => GroupSessionEntity, (session) => session.participants)
  @JoinColumn({ name: 'groupSessionId' })
  groupSession: GroupSessionEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;
}
