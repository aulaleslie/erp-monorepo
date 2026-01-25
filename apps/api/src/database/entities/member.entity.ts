import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MemberStatus } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { PeopleEntity } from './people.entity';

@Entity('members')
@Unique('UQ_members_tenant_person', ['tenantId', 'personId'])
@Unique('UQ_members_tenant_code', ['tenantId', 'memberCode'])
export class MemberEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  personId: string;

  @Column()
  memberCode: string;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.NEW,
  })
  status: MemberStatus;

  @Column({ type: 'timestamptz', nullable: true })
  memberSince: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  currentExpiryDate: Date | null;

  @Column({ type: 'integer', default: 0 })
  profileCompletionPercent: number;

  @Column({ type: 'boolean', default: false })
  agreesToTerms: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  termsAgreedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => PeopleEntity)
  @JoinColumn({ name: 'personId' })
  person: PeopleEntity;
}
