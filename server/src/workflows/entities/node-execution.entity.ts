import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';
import { NodeExecutionStatus } from '../enums/node-execution-status.enum';

@Entity('node_executions')
export class NodeExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowExecution)
  @JoinColumn({ name: 'executionId' })
  execution: WorkflowExecution;

  @Column()
  executionId: string;

  @Column()
  nodeId: string;

  @Column()
  nodeType: string;

  @Column({ type: 'jsonb', nullable: true })
  inputData: any;

  @Column({ type: 'jsonb', nullable: true })
  outputData: any;

  @Column({
    type: 'enum',
    enum: NodeExecutionStatus,
    default: NodeExecutionStatus.PENDING,
  })
  status: NodeExecutionStatus;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;
}
