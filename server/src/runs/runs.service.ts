/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Run,
  RunStatus,
  RunSource,
  RunLogEntry,
  ExtractionProvider,
} from './entities/run.entity';
import { Extractor } from '../extractors/entities/extractor.entity';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { QueueService } from '../shared/queue/queue.service';
import { QueueName } from '../shared/queue/queue-names';
import { FilesService } from '../files/files.service';
import { StorageService } from '../files/storage.service';
import { RunsGateway } from './runs.gateway';
import { OllamaService } from '../shared/ollama/ollama.service';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(Extractor) private extractorRepo: Repository<Extractor>,
    private queueService: QueueService,
    private filesService: FilesService,
    private storageService: StorageService,
    private runsGateway: RunsGateway,
    private ollamaService: OllamaService,
  ) {}

  private pendingLogLines: Map<string, string[]> = new Map();

  private addLog(
    run: Run,
    level: 'info' | 'warn' | 'error',
    message: string,
    source: 'server' | 'parser' | 'extractor' = 'server',
  ) {
    const log: RunLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
    };
    run.logs.push(log);
    this.runsGateway.emitRunLog(run.id, log);

    // Buffer the line for MinIO flush
    const line = `[${log.timestamp}] [${(source || 'server').toUpperCase()}] [${level.toUpperCase()}] ${message}`;
    if (!this.pendingLogLines.has(run.id)) {
      this.pendingLogLines.set(run.id, []);
    }
    this.pendingLogLines.get(run.id)!.push(line);
  }

  private async flushLogs(runId: string): Promise<void> {
    const lines = this.pendingLogLines.get(runId);
    if (!lines || lines.length === 0) return;
    this.pendingLogLines.delete(runId);

    const key = `logs/runs/${runId}.log`;
    try {
      // Read existing log content, then append
      const existing = await this.storageService.getObject(key);
      const content = (existing || '') + lines.join('\n') + '\n';
      await this.storageService.uploadFile(
        key,
        Buffer.from(content, 'utf-8'),
        'text/plain',
      );
    } catch (error) {
      this.logger.error(`Failed to flush logs to MinIO for run ${runId}`, error);
    }
  }

  /**
   * Create a new run and start processing.
   */
  async create(dto: CreateRunDto, userId: string): Promise<Run> {
    // Verify extractor exists and belongs to user
    const extractor = await this.extractorRepo.findOne({
      where: { id: dto.extractorId }, // In a real app, also userId: userId
    });
    if (!extractor) {
      throw new NotFoundException('Extractor not found');
    }

    // Resolve file keys for file sources
    const sources: RunSource[] = await Promise.all(
      dto.sources.map(async (s) => {
        let fileKey: string | undefined;
        if (s.type === 'file' && s.fileId) {
          const file = await this.filesService.getFile(userId, s.fileId);
          fileKey = file?.storageKey;
        }
        return {
          id: uuidv4(),
          type: s.type,
          name: s.name,
          url: s.url,
          fileId: s.fileId,
          fileKey,
          status: 'pending' as const,
        };
      }),
    );

    // Create run
    const run = this.runRepo.create({
      extractorId: dto.extractorId,
      userId,
      sources,
      processingMode: dto.processingMode,
      extractionProvider: dto.extractionProvider,
      status: RunStatus.QUEUED,
      progress: { parsed: 0, total: sources.length, currentStep: 'queued' },
      startedAt: new Date(),
      logs: [],
    });

    await this.runRepo.save(run);

    this.addLog(run, 'info', `Run started with ${sources.length} document(s)`);

    // Send each source to parser via BullMQ
    for (const source of run.sources) {
      source.status = 'parsing';
      this.addLog(run, 'info', `Queuing document '${source.name}' for parsing`);
      await this.queueService.addJob(
        QueueName.UPLOADED_DOCUMENTS,
        'parse-document',
        {
          run_id: run.id,
          document_id: source.id,
          type: source.type,
          file_key: source.fileKey,
          url: source.url,
          name: source.name,
        },
      );

      this.logger.log(`Parse Requested for document ${source.name}`);
    }

    this.addLog(run, 'info', 'All documents queued, parsing started');

    run.status = RunStatus.PARSING;
    run.progress!.currentStep = 'parsing';
    await this.runRepo.save(run);
    await this.flushLogs(run.id);

    this.runsGateway.emitRunUpdated(run.id, run);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: run.status,
      progress: run.progress,
    });

    return run;
  }

  async findAll(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: RunStatus;
      extractorId?: string;
      search?: string;
    },
  ): Promise<{
    data: Run[];
    total: number;
    page: number;
    limit: number;
    statusCounts: { done: number; failed: number };
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.status) where.status = options.status;
    if (options?.extractorId) where.extractorId = options.extractorId;

    const [data, total] = await this.runRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['extractor'],
    });

    // Get status counts (always unfiltered for the user)
    const [doneCount, failedCount] = await Promise.all([
      this.runRepo.count({ where: { userId, status: RunStatus.DONE } }),
      this.runRepo.count({ where: { userId, status: RunStatus.FAILED } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      statusCounts: { done: doneCount, failed: failedCount },
    };
  }

  async findOne(id: string, userId: string): Promise<Run> {
    const run = await this.runRepo.findOne({
      where: { id, userId },
      relations: ['extractor'],
    });
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  /**
   * Handle document parsed event from parser-service
   */
  async handleDocumentParsed(data: any) {
    const { run_id, document_id, status, markdown_content, token_count } = data;
    this.logger.log(
      `📥 Received parsed document event: run=${run_id}, doc=${document_id}, status=${status}`,
    );
    this.logger.debug(
      `Parsed document data: ${JSON.stringify({ run_id, document_id, status, token_count })}`,
    );
    this.logger.log(
      `Processing parsed document for run ${run_id}, doc ${document_id}`,
    );

    const run = await this.runRepo.findOne({ where: { id: run_id } });
    if (!run) return;

    const source = run.sources.find((s) => s.id === document_id);
    if (!source) return;

    // Process any logs sent by the parser worker
    if (data.logs && Array.isArray(data.logs)) {
      for (const workerLog of data.logs) {
        this.addLog(
          run,
          workerLog.level || 'info',
          workerLog.message,
          workerLog.source || 'parser',
        );
      }
    }

    if (status === 'success') {
      source.status = 'parsed';
      source.parsedContent = markdown_content;
      source.tokenCount = token_count;
      this.addLog(
        run,
        'info',
        `Document '${source.name}' parsed successfully (${token_count} tokens)`,
      );
    } else {
      source.status = 'failed';
      source.error = data.error || 'Parsing failed';
      this.addLog(
        run,
        'error',
        `Document '${source.name}' parsing failed: ${source.error}`,
      );
    }

    this.runsGateway.emitRunSourceUpdated(run.id, source);

    run.progress!.parsed += 1;

    // Check if all sources are parsed
    const allParsed = run.sources.every(
      (s) => s.status === 'parsed' || s.status === 'failed',
    );
    if (allParsed) {
      this.logger.log(
        `🎯 All documents parsed for run ${run.id}, starting extraction`,
      );

      const successCount = run.sources.filter(
        (s) => s.status === 'parsed',
      ).length;
      const failedCount = run.sources.filter(
        (s) => s.status === 'failed',
      ).length;
      this.addLog(
        run,
        'info',
        `All documents parsed (${successCount} success, ${failedCount} failed)`,
      );

      run.status = RunStatus.EXTRACTING;
      run.progress!.currentStep = 'extracting';

      // Get extractor configuration
      const extractor = await this.extractorRepo.findOne({
        where: { id: run.extractorId },
      });

      const combinedMarkdown = run.sources
        .map((s) => s.parsedContent)
        .filter(Boolean)
        .join('\n\n');

      if (run.extractionProvider === ExtractionProvider.OLLAMA) {
        // Run extraction in-process using Ollama
        this.logger.log(`🦙 Running Ollama extraction for run ${run.id}`);
        this.addLog(run, 'info', 'Starting extraction with ollama provider');
        this.addLog(run, 'info', 'Running Ollama extraction...');
        try {
          const result = await this.ollamaService.extract(
            combinedMarkdown,
            extractor?.schema || {},
            extractor?.systemPrompt || '',
            'nuextract',
          );

          run.status = RunStatus.DONE;
          run.results = result.data;
          run.metrics = {
            totalInputTokens: result.usage.totalTokens,
            totalOutputTokens: 0,
          };
          run.progress!.currentStep = 'complete';
          run.finishedAt = new Date();
          this.logger.log(`✅ Ollama extraction complete for run ${run.id}`);
          this.addLog(
            run,
            'info',
            `Extraction completed successfully (${result.usage.totalTokens} input tokens)`,
          );
          const durationMs =
            run.finishedAt.getTime() - (run.startedAt?.getTime() || 0);
          this.addLog(
            run,
            'info',
            `Run finished in ${Math.round(durationMs / 1000)}s`,
          );
        } catch (error) {
          this.logger.error(
            `Ollama extraction failed for run ${run.id}: ${error.message}`,
          );
          this.addLog(
            run,
            'error',
            `Ollama extraction failed: ${error.message}`,
          );
          run.status = RunStatus.FAILED;
          run.error = error.message || 'Ollama extraction failed';
          run.finishedAt = new Date();
        }
      } else {
        // Queue extraction to Python worker (doclo / langextract)
        const extractionType =
          run.extractionProvider === ExtractionProvider.LANGEXTRACT
            ? 'langextract'
            : 'llm';

        this.addLog(
          run,
          'info',
          `Starting extraction with ${run.extractionProvider} provider`,
        );

        const extractionPayload = {
          run_id: run.id,
          content: {
            combined_markdown: combinedMarkdown,
          },
          schema: extractor?.schema || {},
          system_prompt: extractor?.systemPrompt || '',
          extraction_type: extractionType,
          model_id: 'nuextract', // extractor?.defaultModel || 'gemini-2.0-flash-exp',
          examples: extractor?.fewShotExamples || [],
        };

        this.logger.log(
          `📤 Sending extraction job: type=${extractionType}, model=${'nuextract'}`,
        );
        this.logger.debug(
          `Extraction payload: ${JSON.stringify(extractionPayload)}`,
        );

        // Trigger extraction with full extractor configuration
        await this.queueService.addJob(
          QueueName.EXTRACTION_REQUESTS,
          'extract-data',
          extractionPayload,
        );
        this.logger.log(
          `✅ Job added to ${QueueName.EXTRACTION_REQUESTS} queue`,
        );
        this.addLog(run, 'info', 'Extraction job queued');
      }
    }

    await this.runRepo.save(run);
    await this.flushLogs(run.id);
    this.runsGateway.emitRunUpdated(run.id, run);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: run.status,
      progress: run.progress,
    });
  }

  /**
   * Handle extraction completed event from extraction-service
   */
  async handleExtractionCompleted(data: any) {
    const { run_id, status, result, usage } = data;
    this.logger.log(
      `📥 Received extraction completed event: run=${run_id}, status=${status}`,
    );
    this.logger.debug(
      `Extraction result data: ${JSON.stringify({ run_id, status, usage })}`,
    );
    this.logger.log(`Processing extraction completion for run ${run_id}`);

    const run = await this.runRepo.findOne({ where: { id: run_id } });
    if (!run) return;

    // Process any logs sent by the extraction worker
    if (data.logs && Array.isArray(data.logs)) {
      for (const workerLog of data.logs) {
        this.addLog(
          run,
          workerLog.level || 'info',
          workerLog.message,
          workerLog.source || 'extractor',
        );
      }
    }

    if (status === 'success') {
      run.status = RunStatus.DONE;
      run.results = result;
      run.metrics = {
        totalInputTokens: usage?.input_tokens,
        totalOutputTokens: usage?.output_tokens,
      };
      run.progress!.currentStep = 'complete';
      this.addLog(
        run,
        'info',
        `Extraction completed successfully (${usage?.input_tokens || 0} input tokens)`,
      );
    } else {
      run.status = RunStatus.FAILED;
      run.error = data.error || 'Extraction failed';
      this.addLog(
        run,
        'error',
        `Extraction failed: ${run.error}`,
      );
    }

    run.finishedAt = new Date();
    const durationMs =
      run.finishedAt.getTime() - (run.startedAt?.getTime() || 0);
    this.addLog(
      run,
      'info',
      `Run finished in ${Math.round(durationMs / 1000)}s`,
    );
    await this.runRepo.save(run);
    await this.flushLogs(run.id);
    this.runsGateway.emitRunUpdated(run.id, run);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: run.status,
      progress: run.progress,
    });
  }

  async update(id: string, userId: string, updateRunDto: UpdateRunDto) {
    const run = await this.findOne(id, userId);
    Object.assign(run, updateRunDto);
    return this.runRepo.save(run);
  }

  async retry(id: string, userId: string): Promise<Run> {
    const run = await this.findOne(id, userId);

    // Reset run state
    run.status = RunStatus.QUEUED;
    run.error = null;
    run.results = null;
    run.startedAt = new Date();
    run.finishedAt = null;
    run.progress = {
      parsed: 0,
      total: run.sources.length,
      currentStep: 'queued',
    };

    // Reset sources
    run.sources.forEach((source) => {
      source.status = 'pending';
      source.error = undefined;
      source.parsedContent = undefined;
      source.tokenCount = undefined;
    });

    this.addLog(run, 'info', 'Run restarted');
    this.addLog(
      run,
      'info',
      `Resetting ${run.sources.length} sources and re-queuing`,
    );

    await this.runRepo.save(run);
    await this.flushLogs(run.id);

    // Re-queue documents
    for (const source of run.sources) {
      source.status = 'parsing';
      this.addLog(
        run,
        'info',
        `Queuing document '${source.name}' for parsing`,
      );
      await this.queueService.addJob(
        QueueName.UPLOADED_DOCUMENTS,
        'parse-document',
        {
          run_id: run.id,
          document_id: source.id,
          type: source.type,
          file_key: source.fileKey,
          url: source.url,
          name: source.name,
        },
      );
    }

    run.status = RunStatus.PARSING;
    run.progress.currentStep = 'parsing';
    await this.runRepo.save(run);
    await this.flushLogs(run.id);
    this.runsGateway.emitRunUpdated(run.id, run);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: run.status,
      progress: run.progress,
    });

    return run;
  }

  async remove(id: string, userId: string) {
    const run = await this.findOne(id, userId);
    return this.runRepo.remove(run);
  }
}
