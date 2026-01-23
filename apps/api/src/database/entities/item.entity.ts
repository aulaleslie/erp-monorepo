import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { CategoryEntity } from './category.entity';

export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum ItemServiceKind {
  MEMBERSHIP = 'MEMBERSHIP',
  PT_SESSION = 'PT_SESSION',
}

export enum ItemDurationUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('items')
@Unique('UQ_items_tenant_code', ['tenantId', 'code'])
@Index('IDX_items_tenant_barcode', ['tenantId', 'barcode'], {
  unique: true,
  where: '"barcode" IS NOT NULL',
})
@Index('IDX_items_tenant_name_category_null', ['tenantId', 'name', 'type'], {
  unique: true,
  where: '"categoryId" IS NULL',
})
@Unique('UQ_items_tenant_name_category', [
  'tenantId',
  'name',
  'type',
  'categoryId',
])
export class ItemEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  type: ItemType;

  @Column({
    type: 'enum',
    enum: ItemServiceKind,
    nullable: true,
  })
  serviceKind: ItemServiceKind | null;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.ACTIVE,
  })
  status: ItemStatus;

  @Column({ type: 'varchar', nullable: true })
  barcode: string | null;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  tags?: string[];

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: true })
  durationValue: number | null;

  @Column({
    type: 'enum',
    enum: ItemDurationUnit,
    nullable: true,
  })
  durationUnit: ItemDurationUnit | null;

  @Column({ type: 'int', nullable: true })
  sessionCount: number | null;

  @Column({ type: 'int', nullable: true })
  includedPtSessions: number | null;

  @Column({ type: 'varchar', nullable: true })
  imageKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageMimeType: string | null;

  @Column({ type: 'int', nullable: true })
  imageSize: number | null;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'categoryId' })
  category: CategoryEntity | null;
}
