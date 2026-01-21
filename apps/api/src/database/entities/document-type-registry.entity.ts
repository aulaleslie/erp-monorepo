import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentModule } from '@gym-monorepo/shared';

@Entity('document_type_registry')
export class DocumentTypeRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  documentKey: string;

  @Column({
    type: 'enum',
    enum: DocumentModule,
  })
  module: DocumentModule;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  requiresItems: boolean;

  @Column({ type: 'int', default: 1 })
  approvalSteps: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
