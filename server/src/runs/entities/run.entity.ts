import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Extractor } from '../../extractors/entities/extractor.entity';
import { User } from '../../user/entities/user.entity';
import { WorkflowExecution } from '../../workflows/entities/workflow-execution.entity';

// Enums
export enum RunStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PARSING = 'parsing',
  EXTRACTING = 'extracting',
  DONE = 'done',
  FAILED = 'failed',
  REVIEW = 'review',
}

export enum ProcessingMode {
  UNIFIED = 'unified', // Combine all docs, extract once
  PER_DOCUMENT = 'per_document', // Extract each doc separately
}

export enum ExtractionProvider {
  DOCLO = 'doclo', // Default: internal @doclo/flows
  LANGEXTRACT = 'langextract', // Future: external Python worker
  FREELLM = 'freellm', // FreeLLM gateway (OpenAI-compatible, runs in NestJS server)
}

// JSONB Interfaces
export interface RunSource {
  id: string;
  type: 'file' | 'url';
  name: string;
  url?: string;
  fileId?: string;
  fileKey?: string; // S3/MinIO key for parser
  fileUrl?: string;
  status: 'pending' | 'parsing' | 'parsed' | 'failed' | 'cancelled';
  error?: string;
  parsedContent?: string;
  tokenCount?: number;
  // Per-document extraction tracking (PER_DOCUMENT mode only)
  extractionStatus?: 'pending' | 'extracting' | 'done' | 'failed' | 'cancelled';
  extractionResult?: Record<string, unknown> | unknown[];
  extractionError?: string;
  // Flag used during per-source retry to only trigger extraction for retried sources
  isRetrying?: boolean;
  // Stored during selective-field retry so completion handler can merge new fields into old result
  previousExtractionResult?: Record<string, unknown> | unknown[];
  // Monotonically increasing counter to reject stale parse results after retry
  retryGeneration?: number;
}

interface RunProgress {
  parsed: number;
  total: number;
  currentStep: 'queued' | 'parsing' | 'extracting' | 'complete';
  // Batch mode extraction progress
  extracted?: number;
  extractionTotal?: number;
}

export interface RunLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: 'server' | 'parser' | 'extractor';
}

export interface RunMetrics {
  totalDurationMs?: number;
  totalCostUSD?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
}

export interface SortConfig {
  referenceValues: string[];
  matchColumn: string;
  fileName: string;
  referenceColumn: string;
}

// Entity
@Entity('runs')
@Index(['userId', 'status'])
@Index(['extractorId'])
@Index(['createdAt'])
export class Run {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column('uuid')
  @ApiProperty()
  extractorId: string;

  @Column('uuid', { nullable: true })
  @ApiProperty()
  userId: string;

  @Column({ type: 'jsonb' })
  @ApiProperty()
  sources: RunSource[];

  @Column({
    type: 'enum',
    enum: ProcessingMode,
    default: ProcessingMode.UNIFIED,
  })
  @ApiProperty({ enum: ProcessingMode })
  processingMode: ProcessingMode;

  @Column({
    type: 'enum',
    enum: ExtractionProvider,
    default: ExtractionProvider.DOCLO,
  })
  @ApiProperty({ enum: ExtractionProvider })
  extractionProvider: ExtractionProvider;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.PENDING })
  @ApiProperty({ enum: RunStatus })
  status: RunStatus;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional()
  progress: RunProgress | null;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional()
  results: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional()
  metrics: RunMetrics | null;

  @Column({ type: 'jsonb', default: [] })
  @ApiProperty()
  logs: RunLogEntry[];

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional()
  error: string | null;

  @Column({ type: 'float', nullable: true })
  @ApiPropertyOptional()
  confidence: number | null;

  // Future: Autorun support
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional()
  autorunId: string | null;

  @Column({ default: false })
  @ApiProperty()
  isAutorun: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  @ApiPropertyOptional()
  isDemo: boolean;

  // Schema customization: variant selection + field skipping
  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    description: 'ID of schema variant used for this run',
  })
  variantId: string | null;

  @Column('jsonb', { nullable: true })
  @ApiPropertyOptional({
    description: 'Field names excluded from extraction',
    example: ['optional_notes', 'internal_reference'],
  })
  skippedFields: string[] | null;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    description: 'LLM model used for extraction',
  })
  model: string | null;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({
    description: 'Reference sort configuration from uploaded XLSX',
  })
  sortConfig: SortConfig | null;

  // Workflow execution link
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional()
  workflowExecutionId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @ApiPropertyOptional()
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  @ApiPropertyOptional()
  finishedAt: Date | null;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Extractor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'extractorId' })
  extractor: Extractor;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => WorkflowExecution, { nullable: true })
  @JoinColumn({ name: 'workflowExecutionId' })
  workflowExecution: WorkflowExecution | null;
}
