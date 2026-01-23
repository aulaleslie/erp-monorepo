import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentRelationType } from '@gym-monorepo/shared';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { TenantEntity } from './tenant.entity';
import { DocumentEntity } from './document.entity';

@Entity('document_relations')
export class DocumentRelationEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  fromDocumentId: string;

  @Column({ type: 'uuid' })
  toDocumentId: string;

  @Column({
    type: 'enum',
    enum: DocumentRelationType,
  })
  relationType: DocumentRelationType;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'fromDocumentId' })
  fromDocument: DocumentEntity;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'toDocumentId' })
  toDocument: DocumentEntity;
}
