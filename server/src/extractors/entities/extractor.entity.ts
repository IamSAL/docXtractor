import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface FewShotExampleSource {
  id: string;
  type: 'file' | 'url' | 'text';
  name: string;
  description: string;
  content: string;       // original: MinIO public URL for file, URL string for url, raw text for text
  storageKey?: string;   // MinIO storage key for file type (e.g. "user-id/timestamp_file.pdf")
  parsedContent?: string; // parsed markdown; populated async by background job for file/url types
}

export interface FewShotExample {
  id: string;
  name: string;
  sources: FewShotExampleSource[];
  output: string;
}

export interface SchemaVariant {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
}

@Entity()
export class Extractor {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Invoice Processor' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Extracts data from invoices' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.png' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @ApiProperty({ example: { type: 'object', properties: {} } })
  @Column('jsonb')
  schema: Record<string, any>;

  @ApiProperty({ example: 'Extract data accurately' })
  @Column('text')
  systemPrompt: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: [{ id: '1', name: 'Ex', sources: [], output: '{}' }],
  })
  @Column('jsonb', { default: [] })
  fewShotExamples: FewShotExample[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: [],
  })
  @Column('jsonb', { default: [] })
  variants: SchemaVariant[];

  @ApiPropertyOptional({ default: false })
  @Column({ default: false })
  consensusEnabled: boolean;

  @ApiPropertyOptional({ default: 85 })
  @Column('float', { default: 85 })
  confidenceThreshold: number;

  @ApiPropertyOptional({
    enum: ['majority', 'highest_confidence', 'human_review', 'conservative'],
    default: 'majority',
  })
  @Column({
    type: 'enum',
    enum: ['majority', 'highest_confidence', 'human_review', 'conservative'],
    default: 'majority',
  })
  conflictResolution:
    | 'majority'
    | 'highest_confidence'
    | 'human_review'
    | 'conservative';

  @ApiPropertyOptional({
    enum: ['docling', 'markitdown', 'pymupdf', 'opendataloader'],
    default: 'docling',
    description: 'Parser engine used for document parsing',
  })
  @Column({
    type: 'enum',
    enum: ['docling', 'markitdown', 'pymupdf', 'opendataloader'],
    default: 'docling',
  })
  parserEngine: 'docling' | 'markitdown' | 'pymupdf' | 'opendataloader';

  @ApiPropertyOptional({ default: false })
  @Column({ default: false })
  citationEnabled: boolean;

  @ApiPropertyOptional({ default: false })
  @Column({ default: false })
  citationIncludePdfPage: boolean;

  @ApiPropertyOptional({ default: false })
  @Column({ default: false })
  citationIncludeBbox: boolean;

  @ApiPropertyOptional({ default: false })
  @Column({ default: false })
  citationIncludeParagraphId: boolean;

  @ApiPropertyOptional({ default: '128k' })
  @Column({ default: '128k' })
  contextWindow: string;

  @ApiPropertyOptional({ default: 'gpt-4o' })
  @Column({ default: 'gpt-4o' })
  defaultModel: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
