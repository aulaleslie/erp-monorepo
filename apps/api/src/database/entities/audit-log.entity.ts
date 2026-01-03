import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityName: string;

  @Column()
  entityId: string;

  @Column()
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_REMOVE';

  @Column({ type: 'uuid', nullable: true })
  performedBy: string | null;

  @Column({ type: 'jsonb', nullable: true })
  previousValues: any;

  @Column({ type: 'jsonb', nullable: true })
  newValues: any;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
