import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { TagEntity } from './tag.entity';

@Entity('tag_links')
@Unique('UQ_tag_links_resource', [
  'tenantId',
  'tagId',
  'resourceType',
  'resourceId',
])
export class TagLinkEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  tagId: string;

  @Column({ type: 'varchar' })
  resourceType: string;

  @Column({ type: 'uuid' })
  resourceId: string;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => TagEntity)
  @JoinColumn({ name: 'tagId' })
  tag: TagEntity;
}
