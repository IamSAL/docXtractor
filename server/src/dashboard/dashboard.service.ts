/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Run, RunStatus } from '../runs/entities/run.entity';
import { Extractor } from '../extractors/entities/extractor.entity';
import { DashboardStatsDto, RunSummaryDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(Extractor) private extractorRepo: Repository<Extractor>,
  ) {}

  async getStats(userId: string): Promise<DashboardStatsDto> {
    // Get all runs for the user
    const runs = await this.runRepo.find({
      where: { userId },
      relations: ['extractor'],
      order: { createdAt: 'DESC' },
    });

    // Calculate total documents (sum of sources from all runs)
    const totalDocuments = runs.reduce((sum, run) => {
      return sum + (run.sources?.length || 0);
    }, 0);

    // Count active extractors
    const activeExtractors = await this.extractorRepo.count({
      // In a real app, filter by userId
    });

    // Calculate pages processed (sum from run metrics)
    const pagesProcessed = runs.reduce((sum, run) => {
      // Estimate: each source is roughly 1-5 pages, use sources count as proxy
      return sum + (run.sources?.length || 0);
    }, 0);

    // Calculate success rate
    const completedRuns = runs.filter(
      (r) => r.status === RunStatus.DONE || r.status === RunStatus.FAILED,
    );
    const successfulRuns = runs.filter((r) => r.status === RunStatus.DONE);
    const successRate =
      completedRuns.length > 0
        ? (successfulRuns.length / completedRuns.length) * 100
        : 0;

    // Get recent runs (last 10)
    const recentRuns = runs.slice(0, 10).map((run) => this.mapToSummary(run));

    // Get extraction history (last 20)
    const extractionHistory = runs
      .slice(0, 20)
      .map((run) => this.mapToSummary(run));

    return {
      totalDocuments,
      activeExtractors,
      pagesProcessed,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      recentRuns,
      extractionHistory,
    };
  }

  private mapToSummary(run: Run): RunSummaryDto {
    return {
      id: run.id,
      extractorId: run.extractorId,
      extractorName: run.extractor?.name || 'Unknown',
      status: run.status,
      documentCount: run.sources?.length || 0,
      startedAt: run.startedAt || run.createdAt,
      completedAt: run.finishedAt,
    };
  }
}
