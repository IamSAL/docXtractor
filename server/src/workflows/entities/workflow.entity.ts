import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	CreateDateColumn,
	UpdateDateColumn,
	JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { WorkflowStatus } from '../enums/workflow-status.enum';

export interface WorkflowDefinition {
	nodes: WorkflowNode[];
	connections: WorkflowConnection[];
}

export interface WorkflowNode {
	id: string;
	type: string; // webhook_trigger, extract_data, send_email, etc.
	position: { x: number; y: number };
	params: Record<string, any>;
}

export interface WorkflowConnection {
	id: string;
	source: string; // node ID
	target: string; // node ID
	sourceHandle?: string;
	targetHandle?: string;
}

export interface TriggerConfig {
	type: 'webhook' | 'email' | 'schedule' | 'google_drive' | 's3';
	webhookPath?: string;
	imapConfig?: {
		host: string;
		port: number;
		user: string;
		password: string; // Encrypted
		folder: string;
		filterSubject?: string;
		filterFrom?: string;
	};
	cronExpression?: string;
	timezone?: string;
}

@Entity('workflows')
export class Workflow {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ type: 'jsonb' })
	definition: WorkflowDefinition;

	@Column({
		type: 'enum',
		enum: WorkflowStatus,
		default: WorkflowStatus.DRAFT,
	})
	status: WorkflowStatus;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column()
	userId: string;

	@Column({ type: 'jsonb', nullable: true })
	triggerConfig: TriggerConfig;

	@Column({ type: 'timestamptz', nullable: true })
	lastTriggeredAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
