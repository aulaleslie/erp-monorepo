import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseAuditEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy: string;
}
