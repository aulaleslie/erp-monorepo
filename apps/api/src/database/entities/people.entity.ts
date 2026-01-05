import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PeopleStatus, PeopleType } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from '../../database/entities';

@Entity('people')
@Unique('UQ_people_tenant_code', ['tenantId', 'code'])
@Index('UQ_people_tenant_email', ['tenantId', 'email'], {
  unique: true,
  where: '"email" IS NOT NULL',
})
@Index('UQ_people_tenant_phone', ['tenantId', 'phone'], {
  unique: true,
  where: '"phone" IS NOT NULL',
})
export class PeopleEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: PeopleType,
  })
  type: PeopleType;

  @Column()
  code: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({
    type: 'enum',
    enum: PeopleStatus,
    default: PeopleStatus.ACTIVE,
  })
  status: PeopleStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}
