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
  @ApiProperty({ description: 'Total number of documents processed' })
  totalDocuments: number;

  @ApiProperty({ description: 'Number of active extractors' })
  activeExtractors: number;

  @ApiProperty({ description: 'Total pages processed' })
  pagesProcessed: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Recent runs', type: [RunSummaryDto] })
  recentRuns: RunSummaryDto[];

  @ApiProperty({ description: 'Extraction history', type: [RunSummaryDto] })
  extractionHistory: RunSummaryDto[];
}
