import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExecutionStatus {
  QUEUED = 'QUEUED',
  DIAGNOSING = 'DIAGNOSING',
  DIAGNOSIS_COMPLETE = 'DIAGNOSIS_COMPLETE',
  REPAIRING = 'REPAIRING',
  REPAIR_COMPLETE = 'REPAIR_COMPLETE',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('executions')
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workOrderId: string;

  @Column({ nullable: true })
  quoteId: string;

  @Column()
  technicianId: string;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.QUEUED,
  })
  status: ExecutionStatus;

  @Column('int', { default: 0 })
  priority: number;

  @Column('text', { nullable: true })
  diagnosisNotes: string;

  @Column('text', { nullable: true })
  repairNotes: string;

  @Column('jsonb', { nullable: true })
  partsUsed: Array<{
    partId: string;
    name: string;
    quantity: number;
  }>;

  @Column('jsonb', { nullable: true })
  servicesPerformed: Array<{
    serviceId: string;
    name: string;
    duration: number;
  }>;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  diagnosisCompletedAt: Date;

  @Column({ nullable: true })
  repairCompletedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;
}
