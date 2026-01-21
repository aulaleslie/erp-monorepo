import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { DocumentEntity } from './document.entity';
import { ItemEntity } from './item.entity';

@Entity('document_items')
export class DocumentItemEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'varchar' })
  itemName: string;

  @Column({ type: 'varchar' })
  itemType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  unitPrice: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  discountAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  taxAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  lineTotal: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;
}
