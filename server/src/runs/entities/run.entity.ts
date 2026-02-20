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

// Enums
export enum RunStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PARSING = 'parsing',
  EXTRACTING = 'extracting',
  DONE = 'done',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVIEW = 'review',
}

export enum ProcessingMode {
  UNIFIED = 'unified', // Combine all docs, extract once
  PER_DOCUMENT = 'per_document', // Extract each doc separately
}

export enum ExtractionProvider {
  DOCLO = 'doclo', // Default: internal @doclo/flows
  LANGEXTRACT = 'langextract', // Future: external Python worker
  OLLAMA = 'ollama', // Local Ollama model (runs in NestJS server)
}

// JSONB Interfaces
export interface RunSource {
  id: string;
  type: 'file' | 'url';
  name: string;
  url?: string;
  fileId?: string;
  fileKey?: string; // S3/MinIO key for parser
  status: 'pending' | 'parsing' | 'parsed' | 'failed';
  error?: string;
  parsedContent?: string;
  tokenCount?: number;
}

export interface RunProgress {
  parsed: number;
  total: number;
  currentStep: 'queued' | 'parsing' | 'extracting' | 'complete';
}

export interface RunLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface RunMetrics {
  totalDurationMs?: number;
  totalCostUSD?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
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

  @Column('uuid')
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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
