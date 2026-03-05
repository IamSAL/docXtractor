import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { ExecutionStatus } from '../enums/execution-status.enum';

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  executionData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  triggerPayload: any;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
