import { ApiProperty } from '@nestjs/swagger';

export class RunSummaryDto {
  @ApiProperty({ description: 'Run ID' })
  id: string;

  @ApiProperty({ description: 'Extractor ID' })
  extractorId: string;

  @ApiProperty({ description: 'Extractor name' })
  extractorName: string;

  @ApiProperty({ description: 'Run status' })
  status: string;

  @ApiProperty({ description: 'Number of documents/sources' })
  documentCount: number;

  @ApiProperty({ description: 'Started at timestamp' })
  startedAt: Date;

  @ApiProperty({
    description: 'Completed at timestamp',
    required: false,
    nullable: true,
  })
  completedAt?: Date | null;
}

export class DashboardStatsDto {
  @ApiProperty({ example: 1250 })
  totalDocuments: number;

  @ApiProperty({ example: 8 })
  activeExtractors: number;

  @ApiProperty({ example: 45000 })
  pagesProcessed: number;

  @ApiProperty({ example: 98.5 })
  successRate: number;

  @ApiProperty({ type: [RunSummaryDto] })
  recentRuns: RunSummaryDto[];

  @ApiProperty({ type: [RunSummaryDto] })
  extractionHistory: RunSummaryDto[];

  @ApiProperty({ example: { cpu: 45, ram: 60, storage: 30 } })
  systemStats: {
    cpu: number;
    ram: number;
    storage: number;
  };
}
