/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Run,
  RunStatus,
  RunSource,
  RunLogEntry,
  ExtractionProvider,
  ProcessingMode,
} from './entities/run.entity';
import { Extractor } from '../extractors/entities/extractor.entity';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { RetrySourcesDto, RetryMode } from './dto/retry-sources.dto';
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
    private configService: ConfigService,
  ) {}

  /**
   * Resolve the effective schema for a run, considering variant selection and skipped fields.
   */
  private resolveEffectiveSchema(
    extractor: Extractor | null,
    variantId: string | null | undefined,
    skippedFields: string[] | null | undefined,
  ): Record<string, any> {
    let schema = extractor?.schema || {};

    // Use variant schema if specified
    if (variantId && extractor?.variants?.length) {
      const variant = extractor.variants.find((v) => v.id === variantId);
      if (variant) schema = variant.schema;
    }

    // Apply skipped fields filter
    if (!skippedFields?.length) return schema;

    const filtered = { ...schema };
    if (filtered.properties) {
      filtered.properties = { ...filtered.properties };
      for (const field of skippedFields) {
        delete filtered.properties[field];
      }
    }
    if (Array.isArray(filtered.required)) {
      filtered.required = filtered.required.filter(
        (f: string) => !skippedFields.includes(f),
      );
    }
    return filtered;
  }

  private pendingLogLines: Map<string, string[]> = new Map();
  // Serialize concurrent extraction completions per run to prevent race conditions
  private extractionLocks: Map<string, Promise<void>> = new Map();

  /**
   * Serialize async operations per run to prevent concurrent Ollama
   * completion handlers from clobbering each other's DB writes.
   */
  private async serializeOllamaCompletion(
    runId: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    const existingLock = this.extractionLocks.get(runId) || Promise.resolve();
    const newLock = existingLock.then(fn);
    this.extractionLocks.set(
      runId,
      newLock.catch(() => {}),
    );
    await newLock;
  }

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
      this.logger.error(
        `Failed to flush logs to MinIO for run ${runId}`,
        error,
      );
    }
  }

  /**
   * Annotate extraction results with _source field and flatten into array of objects.
   */
  private annotateResultWithSource(
    result: any,
    sourceName: string,
  ): Record<string, unknown>[] {
    if (Array.isArray(result)) {
      return (result as unknown[]).map((item) => {
        if (typeof item === 'object' && item !== null) {
          return { _source: sourceName, ...(item as Record<string, unknown>) };
        }
        return { _source: sourceName, value: item };
      });
    }

    if (typeof result === 'object' && result !== null) {
      const obj = result as Record<string, unknown>;
      const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
      if (arrayKey) {
        return (obj[arrayKey] as unknown[]).map((item) => {
          if (typeof item === 'object' && item !== null) {
            return {
              _source: sourceName,
              ...(item as Record<string, unknown>),
            };
          }
          return { _source: sourceName, value: item };
        });
      }
      return [{ _source: sourceName, ...obj }];
    }

    return [{ _source: sourceName, value: result }];
  }

  /**
   * Merge new extraction result into a previous one (for selective-field retry).
   * If previous exists, new fields overwrite old fields while preserving untouched fields.
   */
  private mergeExtractionResult(
    previous: Record<string, unknown> | unknown[] | undefined,
    current: any,
  ): any {
    if (!previous) return current;

    // Both arrays (per-document mode typically returns arrays of row objects)
    if (Array.isArray(previous) && Array.isArray(current)) {
      // Merge row-by-row by index
      const merged = [...previous] as Record<string, unknown>[];
      for (let i = 0; i < current.length; i++) {
        const oldRow = merged[i] || {};
        const newRow = current[i] as Record<string, unknown>;
        if (
          typeof oldRow === 'object' &&
          oldRow !== null &&
          typeof newRow === 'object' &&
          newRow !== null
        ) {
          merged[i] = { ...oldRow, ...newRow };
        } else {
          merged[i] = newRow ?? oldRow;
        }
      }
      return merged;
    }

    // Both objects
    if (
      typeof previous === 'object' &&
      !Array.isArray(previous) &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      current !== null
    ) {
      return { ...previous, ...current };
    }

    // Incompatible shapes — just use the new result
    return current;
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
      variantId: dto.variantId || null,
      skippedFields: dto.skippedFields?.length ? dto.skippedFields : null,
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
    const savedRun = await this.runRepo.save(run);
    await this.flushLogs(run.id);

    // Refetch from DB to ensure WebSocket emits committed data
    const freshRun = await this.runRepo.findOne({
      where: { id: run.id },
      relations: ['extractor'],
    });
    this.runsGateway.emitRunUpdated(run.id, freshRun || savedRun);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: (freshRun || savedRun).status,
      progress: (freshRun || savedRun).progress,
    });

    return freshRun || savedRun;
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

    // Ignore stale results from a previous attempt using generation counter
    const expectedGeneration = source.retryGeneration || 0;
    const receivedGeneration = data.retry_generation ?? 0;
    if (receivedGeneration < expectedGeneration) {
      this.logger.warn(
        `Ignoring stale parsed result for source ${document_id} in run ${run_id} ` +
          `(generation ${receivedGeneration} < expected ${expectedGeneration})`,
      );
      return;
    }
    // Also ignore if source was reset to 'pending' (full run retry)
    if (source.status === 'pending') {
      this.logger.warn(
        `Ignoring stale parsed result for source ${document_id} in run ${run_id} (source is pending — was retried)`,
      );
      return;
    }

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

    // Save source status update first, then atomically increment parsed count
    await this.runRepo.save(run);
    await this.runRepo
      .createQueryBuilder()
      .update(Run)
      .set({
        progress: () =>
          `jsonb_set(progress, '{parsed}', (COALESCE((progress->>'parsed')::int, 0) + 1)::text::jsonb)`,
      })
      .where('id = :id', { id: run.id })
      .execute();

    // Re-fetch to get the true state of all sources (avoids race condition)
    const freshRunForCheck = await this.runRepo.findOne({
      where: { id: run_id },
    });
    if (!freshRunForCheck) return;

    // Use re-fetched run from here on to avoid stale data
    Object.assign(run, freshRunForCheck);

    this.runsGateway.emitRunSourceUpdated(run.id, source);

    // PER_DOCUMENT mode: start extraction immediately for each parsed source
    if (
      run.processingMode === ProcessingMode.PER_DOCUMENT &&
      status === 'success'
    ) {
      // Transition run to EXTRACTING on first parsed source
      if (run.status !== RunStatus.EXTRACTING) {
        run.status = RunStatus.EXTRACTING;
        run.progress!.currentStep = 'extracting';
        run.progress!.extracted = 0;
        // Sentinel: extractionTotal=0 prevents premature completion checks.
        // The real total is set once all parsing finishes (see allParsed block below).
        run.progress!.extractionTotal = 0;
      }

      const extractor = await this.extractorRepo.findOne({
        where: { id: run.extractorId },
      });

      // Clear isRetrying flag
      if (source.isRetrying) source.isRetrying = undefined;

      await this.queueSingleExtraction(run, source, extractor);
    }

    // Check if all sources are parsed
    const allParsed = run.sources.every(
      (s) => s.status === 'parsed' || s.status === 'failed',
    );
    if (allParsed) {
      this.logger.log(`🎯 All documents parsed for run ${run.id}`);

      const parsedSources = run.sources.filter((s) => s.status === 'parsed');
      const failedCount = run.sources.filter(
        (s) => s.status === 'failed',
      ).length;
      this.addLog(
        run,
        'info',
        `All documents parsed (${parsedSources.length} success, ${failedCount} failed)`,
      );

      if (run.processingMode === ProcessingMode.PER_DOCUMENT) {
        // Update extractionTotal now that we know the final count
        run.progress!.extractionTotal = parsedSources.length;

        if (parsedSources.length === 0) {
          run.status = RunStatus.FAILED;
          run.error = 'No documents were successfully parsed';
          run.finishedAt = new Date();
          this.addLog(
            run,
            'error',
            'No documents parsed successfully, run failed',
          );
        } else if (run.extractionProvider === ExtractionProvider.OLLAMA) {
          // For Ollama: some extractions may have already completed before
          // extractionTotal was set. Save the real total and trigger a check.
          await this.runRepo.save(run);
          await this.checkOllamaBatchCompletion(run);
        }
        // Otherwise, extractions are already in-flight
      } else {
        // UNIFIED MODE: wait for all parsed, then extract
        if (parsedSources.length === 0) {
          run.status = RunStatus.FAILED;
          run.error = 'No documents were successfully parsed';
          run.finishedAt = new Date();
          this.addLog(
            run,
            'error',
            'No documents parsed successfully, run failed',
          );
        } else {
          run.status = RunStatus.EXTRACTING;
          run.progress!.currentStep = 'extracting';

          const extractor = await this.extractorRepo.findOne({
            where: { id: run.extractorId },
          });

          // Clear any isRetrying flags
          for (const s of parsedSources) {
            s.isRetrying = undefined;
          }
          await this.handleUnifiedExtraction(run, extractor);
        }
      }
    }

    const savedRun = await this.runRepo.save(run);
    await this.flushLogs(run.id);
    // Refetch from DB to ensure WebSocket emits committed data
    const freshRun = await this.runRepo.findOne({
      where: { id: run.id },
      relations: ['extractor'],
    });
    this.runsGateway.emitRunUpdated(run.id, freshRun || savedRun);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: (freshRun || savedRun).status,
      progress: (freshRun || savedRun).progress,
    });
  }

  /**
   * Handle unified extraction: combine all parsed docs and extract once.
   */
  private async handleUnifiedExtraction(run: Run, extractor: Extractor | null) {
    const combinedMarkdown = run.sources
      .map((s) => s.parsedContent)
      .filter(Boolean)
      .join('\n\n');

    if (run.extractionProvider === ExtractionProvider.OLLAMA) {
      this.logger.log(`🦙 Running Ollama extraction for run ${run.id}`);
      this.addLog(run, 'info', 'Starting extraction with ollama provider');
      this.addLog(run, 'info', 'Running Ollama extraction...');
      try {
        const result = await this.ollamaService.extract(
          combinedMarkdown,
          this.resolveEffectiveSchema(
            extractor,
            run.variantId,
            run.skippedFields,
          ),
          extractor?.systemPrompt || '',
          'qwen3:14b',
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
        this.addLog(run, 'error', `Ollama extraction failed: ${error.message}`);
        run.status = RunStatus.FAILED;
        run.error = error.message || 'Ollama extraction failed';
        run.finishedAt = new Date();
      }
    } else {
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
        schema: this.resolveEffectiveSchema(
          extractor,
          run.variantId,
          run.skippedFields,
        ),
        system_prompt: extractor?.systemPrompt || '',
        extraction_type: extractionType,
        model_id: 'qwen3:14b',
        examples: extractor?.fewShotExamples || [],
      };

      this.logger.log(
        `📤 Sending extraction job: type=${extractionType}, model=${'qwen3:14b'}`,
      );

      await this.queueService.addJob(
        QueueName.EXTRACTION_REQUESTS,
        'extract-data',
        extractionPayload,
      );
      this.logger.log(`✅ Job added to ${QueueName.EXTRACTION_REQUESTS} queue`);
      this.addLog(run, 'info', 'Extraction job queued');
    }
  }

  /**
   * Handle batch extraction: extract each parsed document independently.
   */
  private async handleBatchExtraction(
    run: Run,
    parsedSources: RunSource[],
    extractor: Extractor | null,
  ) {
    run.progress!.extracted = 0;
    run.progress!.extractionTotal = parsedSources.length;

    this.addLog(
      run,
      'info',
      `Batch mode: starting ${parsedSources.length} independent extractions`,
    );

    // Initialize extraction status on each parsed source
    for (const source of parsedSources) {
      source.extractionStatus = 'extracting';
    }

    if (run.extractionProvider === ExtractionProvider.OLLAMA) {
      // Ollama: extract each doc in parallel
      this.logger.log(`🦙 Running batch Ollama extraction for run ${run.id}`);
      this.addLog(
        run,
        'info',
        'Starting batch extraction with ollama provider',
      );
      this.addLog(
        run,
        'info',
        `Processing ${parsedSources.length} documents in parallel`,
      );
      run.results = [] as any;
      let totalTokens = 0;

      // Run extractions with throttled concurrency to respect Ollama rate limits
      const OLLAMA_CONCURRENCY = this.configService.get<number>(
        'OLLAMA_CONCURRENCY',
        5,
      );
      this.addLog(
        run,
        'info',
        `Ollama concurrency limit: ${OLLAMA_CONCURRENCY}`,
      );

      const extractOne = async (source: RunSource) => {
        this.addLog(
          run,
          'info',
          `Extracting from '${source.name}' with Ollama`,
        );
        try {
          const result = await this.ollamaService.extract(
            source.parsedContent!,
            this.resolveEffectiveSchema(
              extractor,
              run.variantId,
              run.skippedFields,
            ),
            extractor?.systemPrompt || '',
            'qwen3:14b',
          );

          source.extractionStatus = 'done';
          source.extractionResult = result.data;

          const annotatedRows = this.annotateResultWithSource(
            result.data,
            source.name,
          );

          run.progress!.extracted = (run.progress!.extracted || 0) + 1;
          (run.results as unknown as Record<string, unknown>[]).push(
            ...annotatedRows,
          );
          totalTokens += result.usage.totalTokens;
          this.addLog(
            run,
            'info',
            `Extraction for '${source.name}' completed (${result.usage.totalTokens} tokens)`,
          );

          await this.runRepo.save(run);
          this.runsGateway.emitRunSourceUpdated(run.id, source);
          this.runsGateway.emitRunUpdated(run.id, run);

          return { success: true, source };
        } catch (error) {
          source.extractionStatus = 'failed';
          source.extractionError = error.message;
          run.progress!.extracted = (run.progress!.extracted || 0) + 1;
          this.addLog(
            run,
            'error',
            `Extraction failed for '${source.name}': ${error.message}`,
          );
          this.runsGateway.emitRunSourceUpdated(run.id, source);
          return { success: false, source };
        }
      };

      // Process in batches of OLLAMA_CONCURRENCY
      const results: PromiseSettledResult<any>[] = [];
      for (let i = 0; i < parsedSources.length; i += OLLAMA_CONCURRENCY) {
        const batch = parsedSources.slice(i, i + OLLAMA_CONCURRENCY);
        const batchResults = await Promise.allSettled(batch.map(extractOne));
        results.push(...batchResults);
      }

      // Finalize
      if ((run.results as unknown as Record<string, unknown>[]).length > 0) {
        run.status = RunStatus.DONE;
        run.metrics = { totalInputTokens: totalTokens, totalOutputTokens: 0 };
      } else {
        run.status = RunStatus.FAILED;
        run.error = 'All document extractions failed';
      }
      run.progress!.currentStep = 'complete';
      run.finishedAt = new Date();
      const durationMs =
        run.finishedAt.getTime() - (run.startedAt?.getTime() || 0);
      this.addLog(
        run,
        'info',
        `Batch extraction complete: ${(run.results as unknown as Record<string, unknown>[]).length} rows from ${parsedSources.length} documents in ${Math.round(durationMs / 1000)}s`,
      );
    } else {
      // Queue N separate extraction jobs to Python worker
      const extractionType =
        run.extractionProvider === ExtractionProvider.LANGEXTRACT
          ? 'langextract'
          : 'llm';

      this.addLog(
        run,
        'info',
        `Queuing ${parsedSources.length} batch extraction jobs with ${run.extractionProvider} provider`,
      );

      // Fix 7: bulk-queue all extraction jobs at once for maximum parallelism
      const extractionJobs = parsedSources.map((source) => ({
        name: 'extract-data',
        data: {
          run_id: run.id,
          document_id: source.id,
          source_name: source.name,
          content: {
            combined_markdown: source.parsedContent,
          },
          schema: this.resolveEffectiveSchema(
            extractor,
            run.variantId,
            run.skippedFields,
          ),
          system_prompt: extractor?.systemPrompt || '',
          extraction_type: extractionType,
          model_id: 'qwen3:14b',
          examples: extractor?.fewShotExamples || [],
        },
      }));

      await this.queueService.addBulk(
        QueueName.EXTRACTION_REQUESTS,
        extractionJobs,
      );
      parsedSources.forEach((source) =>
        this.addLog(run, 'info', `Extraction job queued for '${source.name}'`),
      );

      this.logger.log(
        `✅ ${parsedSources.length} batch extraction jobs added to ${QueueName.EXTRACTION_REQUESTS} queue`,
      );
    }
  }

  /**
   * Queue extraction for a single source (used for incremental per-document extraction).
   */
  private async queueSingleExtraction(
    run: Run,
    source: RunSource,
    extractor: Extractor | null,
  ) {
    source.extractionStatus = 'extracting';

    if (run.extractionProvider === ExtractionProvider.OLLAMA) {
      // Ollama: run inline (async, non-blocking for the caller)
      this.extractSingleWithOllama(run, source, extractor).catch(
        async (err) => {
          this.logger.error(
            `Ollama extraction failed (outer) for source ${source.id}: ${err.message}`,
          );
          // Safety net: ensure the source reaches terminal state even if inner catch failed
          try {
            await this.serializeOllamaCompletion(run.id, async () => {
              const freshRun = await this.runRepo.findOne({
                where: { id: run.id },
              });
              if (!freshRun) return;
              const failedSource = freshRun.sources.find(
                (s) => s.id === source.id,
              );
              if (
                failedSource &&
                failedSource.extractionStatus === 'extracting'
              ) {
                failedSource.extractionStatus = 'failed';
                failedSource.extractionError =
                  err.message || 'Extraction failed unexpectedly';
                freshRun.progress!.extracted =
                  (freshRun.progress!.extracted || 0) + 1;
                await this.runRepo.save(freshRun);
                this.runsGateway.emitRunSourceUpdated(
                  freshRun.id,
                  failedSource,
                );
                this.runsGateway.emitRunUpdated(freshRun.id, freshRun);
                await this.checkOllamaBatchCompletion(freshRun);
              }
            });
          } catch (innerErr) {
            this.logger.error(
              `Recovery failed for source ${source.id}: ${(innerErr as Error).message}`,
            );
          }
        },
      );
    } else {
      const extractionType =
        run.extractionProvider === ExtractionProvider.LANGEXTRACT
          ? 'langextract'
          : 'llm';

      const extractionPayload = {
        run_id: run.id,
        document_id: source.id,
        source_name: source.name,
        content: { combined_markdown: source.parsedContent },
        schema: this.resolveEffectiveSchema(
          extractor,
          run.variantId,
          run.skippedFields,
        ),
        system_prompt: extractor?.systemPrompt || '',
        extraction_type: extractionType,
        model_id: 'qwen3:14b',
        examples: extractor?.fewShotExamples || [],
      };

      await this.queueService.addJob(
        QueueName.EXTRACTION_REQUESTS,
        'extract-data',
        extractionPayload,
      );
      this.addLog(run, 'info', `Extraction job queued for '${source.name}'`);
    }
  }

  /**
   * Run Ollama extraction for a single source and handle completion inline.
   * The Ollama HTTP call runs concurrently; only DB writes are serialized.
   */
  private async extractSingleWithOllama(
    run: Run,
    source: RunSource,
    extractor: Extractor | null,
  ) {
    // Run the Ollama call outside the lock so multiple sources extract concurrently
    let extractionResult: any;
    let extractionError: Error | null = null;

    try {
      extractionResult = await this.ollamaService.extract(
        source.parsedContent!,
        this.resolveEffectiveSchema(
          extractor,
          run.variantId,
          run.skippedFields,
        ),
        extractor?.systemPrompt || '',
        'qwen3:14b',
      );
    } catch (error) {
      extractionError = error;
    }

    // Serialize the DB read-modify-write + completion check
    await this.serializeOllamaCompletion(run.id, async () => {
      const freshRun = await this.runRepo.findOne({
        where: { id: run.id },
      });
      if (!freshRun) return;

      const freshSource = freshRun.sources.find((s) => s.id === source.id);
      if (!freshSource) return;

      if (extractionError) {
        freshSource.extractionStatus = 'failed';
        freshSource.extractionError = extractionError.message;
        this.addLog(
          freshRun,
          'error',
          `Extraction failed for '${freshSource.name}': ${extractionError.message}`,
        );
      } else {
        freshSource.extractionStatus = 'done';
        freshSource.extractionResult = extractionResult.data;

        const annotatedRows = this.annotateResultWithSource(
          extractionResult.data,
          freshSource.name,
        );
        if (!freshRun.results) freshRun.results = [] as any;
        (freshRun.results as unknown as Record<string, unknown>[]).push(
          ...annotatedRows,
        );

        if (!freshRun.metrics)
          freshRun.metrics = { totalInputTokens: 0, totalOutputTokens: 0 };
        freshRun.metrics.totalInputTokens =
          (freshRun.metrics.totalInputTokens || 0) +
          extractionResult.usage.totalTokens;

        this.addLog(
          freshRun,
          'info',
          `Extraction for '${freshSource.name}' completed (${extractionResult.usage.totalTokens} tokens)`,
        );
      }

      freshRun.progress!.extracted =
        (freshRun.progress!.extracted || 0) + 1;

      await this.runRepo.save(freshRun);
      this.runsGateway.emitRunSourceUpdated(freshRun.id, freshSource);
      this.runsGateway.emitRunUpdated(freshRun.id, freshRun);

      await this.checkOllamaBatchCompletion(freshRun);
    });
  }

  private async checkOllamaBatchCompletion(run: Run) {
    const extractedCount = run.progress!.extracted || 0;
    const extractionTotal = run.progress!.extractionTotal || 0;
    // extractionTotal=0 is a sentinel meaning "not all parsing is done yet"
    if (extractionTotal > 0 && extractedCount >= extractionTotal) {
      if (
        run.results &&
        (run.results as unknown as Record<string, unknown>[]).length > 0
      ) {
        run.status = RunStatus.DONE;
      } else {
        run.status = RunStatus.FAILED;
        run.error = 'All document extractions failed';
      }
      run.progress!.currentStep = 'complete';
      run.finishedAt = new Date();
      const durationMs =
        run.finishedAt.getTime() - (run.startedAt?.getTime() || 0);
      this.addLog(
        run,
        'info',
        `Batch extraction complete in ${Math.round(durationMs / 1000)}s`,
      );

      await this.runRepo.save(run);
      await this.flushLogs(run.id);

      // Refetch from DB for consistent WebSocket emission
      const freshRun = await this.runRepo.findOne({
        where: { id: run.id },
        relations: ['extractor'],
      });
      this.runsGateway.emitRunUpdated(run.id, freshRun || run);
      this.runsGateway.emitRunsListUpdated({
        runId: run.id,
        status: (freshRun || run).status,
        progress: (freshRun || run).progress,
      });

      // Clean up serialization lock
      this.extractionLocks.delete(run.id);
    }
  }

  /**
   * Handle extraction completed event from extraction-service
   */
  async handleExtractionCompleted(data: any) {
    const { run_id } = data;

    // Serialize per run_id to prevent race conditions in batch mode
    const existingLock = this.extractionLocks.get(run_id) || Promise.resolve();
    const newLock = existingLock.then(() =>
      this._handleExtractionCompletedInner(data),
    );
    this.extractionLocks.set(
      run_id,
      newLock.catch(() => {}),
    );
    await newLock;
  }

  private async _handleExtractionCompletedInner(data: any) {
    const { run_id, document_id, status, result, usage } = data;
    this.logger.log(
      `📥 Received extraction completed event: run=${run_id}, status=${status}`,
    );
    this.logger.debug(
      `Extraction result data: ${JSON.stringify({ run_id, document_id, status, usage })}`,
    );

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

    // UNIFIED mode (or no document_id): existing single-completion behavior
    if (run.processingMode !== ProcessingMode.PER_DOCUMENT || !document_id) {
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
        this.addLog(run, 'error', `Extraction failed: ${run.error}`);
      }

      run.finishedAt = new Date();
      const durationMs =
        run.finishedAt.getTime() - (run.startedAt?.getTime() || 0);
      this.addLog(
        run,
        'info',
        `Run finished in ${Math.round(durationMs / 1000)}s`,
      );
      // Fix 4: clean up lock for unified mode (prevents leak)
      this.extractionLocks.delete(run_id);
    } else {
      // PER_DOCUMENT mode: accumulate per-source results
      const source = run.sources.find((s) => s.id === document_id);
      if (!source) {
        this.logger.warn(`Source ${document_id} not found in run ${run_id}`);
        return;
      }

      if (status === 'success') {
        source.extractionStatus = 'done';
        source.extractionResult = this.mergeExtractionResult(
          source.previousExtractionResult,
          result,
        );
        source.previousExtractionResult = undefined;
        this.addLog(
          run,
          'info',
          `Extraction completed for '${source.name}' (${usage?.input_tokens || 0} input tokens)`,
        );
      } else {
        source.extractionStatus = 'failed';
        source.extractionError = data.error || 'Extraction failed';
        source.previousExtractionResult = undefined;
        this.addLog(
          run,
          'error',
          `Extraction failed for '${source.name}': ${source.extractionError}`,
        );
      }

      // Accumulate metrics incrementally
      if (!run.metrics)
        run.metrics = { totalInputTokens: 0, totalOutputTokens: 0 };
      run.metrics.totalInputTokens =
        (run.metrics.totalInputTokens || 0) + (usage?.input_tokens || 0);
      run.metrics.totalOutputTokens =
        (run.metrics.totalOutputTokens || 0) + (usage?.output_tokens || 0);

      run.progress!.extracted = (run.progress!.extracted || 0) + 1;

      // Incrementally append results so the frontend can display them as they arrive
      if (source.extractionStatus === 'done' && source.extractionResult) {
        if (!run.results) run.results = [] as any;
        const annotated = this.annotateResultWithSource(
          source.extractionResult,
          source.name,
        );
        (run.results as unknown as Record<string, unknown>[]).push(
          ...annotated,
        );
      }

      this.runsGateway.emitRunSourceUpdated(run.id, source);

      // Check if all extractions are complete
      const extractedCount = run.progress!.extracted || 0;
      const extractionTotal = run.progress!.extractionTotal || 0;

      if (extractedCount >= extractionTotal) {
        // All done — results already accumulated incrementally
        if (
          run.results &&
          (run.results as unknown as Record<string, unknown>[]).length > 0
        ) {
          run.status = RunStatus.DONE;
        } else {
          run.status = RunStatus.FAILED;
          run.error = 'All document extractions failed';
        }

        run.progress!.currentStep = 'complete';
        run.finishedAt = new Date();
        const durationMs =
          run.finishedAt.getTime() - (run.startedAt?.getTime() || 0);
        this.addLog(
          run,
          'info',
          `Batch extraction complete: ${(run.results as unknown as Record<string, unknown>[]).length} rows from ${extractionTotal} documents in ${Math.round(durationMs / 1000)}s`,
        );

        // Clean up lock
        this.extractionLocks.delete(run.id);
      }
    }

    const savedRun = await this.runRepo.save(run);
    await this.flushLogs(run.id);
    // Refetch from DB to ensure WebSocket emits committed data
    const freshRun = await this.runRepo.findOne({
      where: { id: run.id },
      relations: ['extractor'],
    });
    this.runsGateway.emitRunUpdated(run.id, freshRun || savedRun);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: (freshRun || savedRun).status,
      progress: (freshRun || savedRun).progress,
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
      source.extractionStatus = undefined;
      source.extractionResult = undefined;
      source.extractionError = undefined;
    });

    this.addLog(run, 'info', 'Run restarted');
    this.addLog(
      run,
      'info',
      `Resetting ${run.sources.length} sources and re-queuing`,
    );

    // Cancel stale jobs from previous attempt before re-queuing
    await this.queueService.removeJobsForRun(
      QueueName.UPLOADED_DOCUMENTS,
      run.id,
    );
    await this.queueService.removeJobsForRun(
      QueueName.EXTRACTION_REQUESTS,
      run.id,
    );
    await this.queueService.clearRunCancellation(run.id);

    await this.runRepo.save(run);
    await this.flushLogs(run.id);

    // Re-queue documents: increment retryGeneration per source so stale results
    // from the previous attempt are rejected by handleDocumentParsed (Fix 6)
    // Fix 7: bulk-queue all parse jobs at once
    const parseJobs = run.sources.map((source) => {
      source.status = 'parsing';
      source.retryGeneration = (source.retryGeneration || 0) + 1;
      this.addLog(run, 'info', `Queuing document '${source.name}' for parsing`);
      return {
        name: 'parse-document',
        data: {
          run_id: run.id,
          document_id: source.id,
          type: source.type,
          file_key: source.fileKey,
          url: source.url,
          name: source.name,
          retry_generation: source.retryGeneration,
        },
      };
    });

    await this.queueService.addBulk(QueueName.UPLOADED_DOCUMENTS, parseJobs);

    run.status = RunStatus.PARSING;
    run.progress.currentStep = 'parsing';
    const savedRun = await this.runRepo.save(run);
    await this.flushLogs(run.id);
    // Refetch from DB to ensure WebSocket emits committed data
    const freshRun = await this.runRepo.findOne({
      where: { id: run.id },
      relations: ['extractor'],
    });
    this.runsGateway.emitRunUpdated(run.id, freshRun || savedRun);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: (freshRun || savedRun).status,
      progress: (freshRun || savedRun).progress,
    });

    return run;
  }

  /**
   * Retry a single failed source within a run.
   */
  async retrySource(
    runId: string,
    sourceId: string,
    userId: string,
  ): Promise<Run> {
    const run = await this.findOne(runId, userId);

    // Validate run is in a retryable state
    const retryableStatuses = [
      RunStatus.DONE,
      RunStatus.FAILED,
      RunStatus.REVIEW,
      RunStatus.PARSING,
      RunStatus.EXTRACTING,
    ];
    if (!retryableStatuses.includes(run.status)) {
      throw new BadRequestException(
        `Cannot retry source when run is in '${run.status}' state`,
      );
    }

    const source = run.sources.find((s) => s.id === sourceId);
    if (!source) {
      throw new NotFoundException('Source not found in this run');
    }

    const isParseFailure = source.status === 'failed';
    const isExtractionFailure =
      source.status === 'parsed' && source.extractionStatus === 'failed';

    if (!isParseFailure && !isExtractionFailure) {
      throw new BadRequestException(
        'Source is not in a failed state (parse or extraction)',
      );
    }

    if (isParseFailure) {
      // --- Parse failure path ---
      source.status = 'parsing';
      source.error = undefined;
      source.parsedContent = undefined;
      source.tokenCount = undefined;
      source.extractionStatus = undefined;
      source.extractionResult = undefined;
      source.extractionError = undefined;
      source.isRetrying = true;

      run.status = RunStatus.PARSING;
      run.finishedAt = null;
      run.error = null;

      // Recalculate parsed progress from actual source states
      run.progress = {
        parsed:
          run.sources.filter(
            (s) => s.status === 'parsed' || s.status === 'failed',
          ).length - 1, // minus this source which we just reset
        total: run.sources.length,
        currentStep: 'parsing',
      };

      // Fix 6: increment generation so stale results from the previous attempt
      // are rejected by handleDocumentParsed
      source.retryGeneration = (source.retryGeneration || 0) + 1;

      this.addLog(run, 'info', `Retrying parse for source '${source.name}'`);

      await this.runRepo.save(run);
      await this.flushLogs(run.id);

      // Queue parse job
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
          retry_generation: source.retryGeneration,
        },
      );
    } else {
      // --- Extraction failure path (PER_DOCUMENT only) ---
      if (run.processingMode === ProcessingMode.UNIFIED) {
        throw new BadRequestException(
          'Cannot retry individual source extraction in unified mode. Use full "Retry Run" instead.',
        );
      }

      source.extractionStatus = 'extracting';
      source.extractionError = undefined;
      source.extractionResult = undefined;

      run.status = RunStatus.EXTRACTING;
      run.finishedAt = null;
      run.error = null;

      // Recalculate extraction progress from actual source states
      const parsedSources = run.sources.filter((s) => s.status === 'parsed');
      const completedExtractions =
        parsedSources.filter(
          (s) =>
            s.extractionStatus === 'done' || s.extractionStatus === 'failed',
        ).length - 1; // minus this source which we just reset
      run.progress = {
        ...run.progress!,
        currentStep: 'extracting',
        extracted: Math.max(0, completedExtractions),
        extractionTotal: parsedSources.length,
      };

      this.addLog(
        run,
        'info',
        `Retrying extraction for source '${source.name}'`,
      );

      const extractor = await this.extractorRepo.findOne({
        where: { id: run.extractorId },
      });

      if (run.extractionProvider === ExtractionProvider.OLLAMA) {
        // Ollama: run inline extraction, then rebuild merged results
        await this.runRepo.save(run);
        await this.flushLogs(run.id);

        // Refetch from DB to ensure WebSocket emits committed data
        const freshRun = await this.runRepo.findOne({
          where: { id: run.id },
          relations: ['extractor'],
        });
        this.runsGateway.emitRunUpdated(run.id, freshRun || run);
        this.runsGateway.emitRunSourceUpdated(run.id, source);

        try {
          const result = await this.ollamaService.extract(
            source.parsedContent!,
            this.resolveEffectiveSchema(
              extractor,
              run.variantId,
              run.skippedFields,
            ),
            extractor?.systemPrompt || '',
            'qwen3:14b',
          );

          source.extractionStatus = 'done';
          source.extractionResult = result.data;
          run.progress.extracted = (run.progress.extracted || 0) + 1;

          this.addLog(
            run,
            'info',
            `Extraction for '${source.name}' completed (${result.usage.totalTokens} tokens)`,
          );
        } catch (error) {
          source.extractionStatus = 'failed';
          source.extractionError = error.message;
          run.progress.extracted = (run.progress.extracted || 0) + 1;

          this.addLog(
            run,
            'error',
            `Extraction failed for '${source.name}': ${error.message}`,
          );
        }

        this.runsGateway.emitRunSourceUpdated(run.id, source);

        // Rebuild merged results from all sources
        const allResults: Record<string, unknown>[] = [];
        for (const s of run.sources) {
          if (s.extractionStatus === 'done' && s.extractionResult) {
            const annotated = this.annotateResultWithSource(
              s.extractionResult,
              s.name,
            );
            allResults.push(...annotated);
          }
        }

        if (allResults.length > 0) {
          run.results = allResults as any;
          run.status = RunStatus.DONE;
        } else {
          run.status = RunStatus.FAILED;
          run.error = 'All document extractions failed';
        }
        run.progress.currentStep = 'complete';
        run.finishedAt = new Date();
      } else {
        // Queue-based extraction: queue a single extraction job
        const extractionType =
          run.extractionProvider === ExtractionProvider.LANGEXTRACT
            ? 'langextract'
            : 'llm';

        await this.queueService.addJob(
          QueueName.EXTRACTION_REQUESTS,
          'extract-data',
          {
            run_id: run.id,
            document_id: source.id,
            source_name: source.name,
            content: {
              combined_markdown: source.parsedContent,
            },
            schema: this.resolveEffectiveSchema(
              extractor,
              run.variantId,
              run.skippedFields,
            ),
            system_prompt: extractor?.systemPrompt || '',
            extraction_type: extractionType,
            model_id: 'qwen3:14b',
            examples: extractor?.fewShotExamples || [],
          },
        );

        this.addLog(run, 'info', `Extraction job queued for '${source.name}'`);
      }

      await this.runRepo.save(run);
      await this.flushLogs(run.id);
    }

    // Refetch from DB to ensure WebSocket emits committed data
    const freshRun = await this.runRepo.findOne({
      where: { id: run.id },
      relations: ['extractor'],
    });
    const runToEmit = freshRun || run;

    this.runsGateway.emitRunUpdated(run.id, runToEmit);
    this.runsGateway.emitRunSourceUpdated(run.id, source);
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: runToEmit.status,
      progress: runToEmit.progress,
    });

    return runToEmit;
  }

  /**
   * Batch retry specific sources with options for mode, schema variant, and field selection.
   */
  async retrySourcesBatch(
    runId: string,
    userId: string,
    dto: RetrySourcesDto,
  ): Promise<Run> {
    const run = await this.findOne(runId, userId);

    const retryableStatuses = [
      RunStatus.DONE,
      RunStatus.FAILED,
      RunStatus.REVIEW,
      RunStatus.PARSING,
      RunStatus.EXTRACTING,
    ];
    if (!retryableStatuses.includes(run.status)) {
      throw new BadRequestException(
        `Cannot retry sources when run is in '${run.status}' state`,
      );
    }

    const sources = dto.sourceIds.map((sid) => {
      const s = run.sources.find((src) => src.id === sid);
      if (!s) throw new NotFoundException(`Source '${sid}' not found`);
      return s;
    });

    const extractor = await this.extractorRepo.findOne({
      where: { id: run.extractorId },
    });

    // Resolve schema: use dto overrides, else fall back to run's saved variant/skipped
    const effectiveVariantId =
      dto.schemaVariantId !== undefined
        ? dto.schemaVariantId || null
        : run.variantId;

    // Build effective schema with field selection
    let effectiveSchema = this.resolveEffectiveSchema(
      extractor,
      effectiveVariantId,
      null,
    );

    // If selectedFields provided, filter schema to only those fields
    if (dto.selectedFields?.length && effectiveSchema.properties) {
      const filtered: Record<string, any> = {
        ...effectiveSchema,
        properties: {},
      };
      for (const field of dto.selectedFields) {
        if (effectiveSchema.properties[field]) {
          filtered.properties[field] = effectiveSchema.properties[field];
        }
      }
      if (Array.isArray(filtered.required)) {
        filtered.required = (filtered.required as string[]).filter(
          (r: string) => dto.selectedFields!.includes(r),
        );
      }
      effectiveSchema = filtered;
    }

    if (dto.mode === RetryMode.PARSE_AND_EXTRACTION) {
      // Reset sources fully and re-parse
      for (const source of sources) {
        if (dto.selectedFields?.length && source.extractionResult) {
          source.previousExtractionResult = source.extractionResult;
        } else {
          source.previousExtractionResult = undefined;
        }
        source.status = 'parsing';
        source.error = undefined;
        source.parsedContent = undefined;
        source.tokenCount = undefined;
        source.extractionStatus = undefined;
        source.extractionResult = undefined;
        source.extractionError = undefined;
        source.isRetrying = true;
      }

      run.status = RunStatus.PARSING;
      run.finishedAt = null;
      run.error = null;
      run.progress = {
        parsed: run.sources.filter(
          (s) =>
            (s.status === 'parsed' || s.status === 'failed') &&
            !sources.includes(s),
        ).length,
        total: run.sources.length,
        currentStep: 'parsing',
      };

      this.addLog(
        run,
        'info',
        `Batch retry (parse+extraction) for ${sources.length} source(s)`,
      );
      await this.runRepo.save(run);
      await this.flushLogs(run.id);

      for (const source of sources) {
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
    } else {
      // Extraction only — sources must be parsed
      const unparsed = sources.filter((s) => s.status !== 'parsed');
      if (unparsed.length) {
        throw new BadRequestException(
          `Cannot retry extraction-only for unparsed sources: ${unparsed.map((s) => s.name).join(', ')}. Use parse+extraction mode instead.`,
        );
      }

      for (const source of sources) {
        // If retrying with selected fields, preserve old result for merging
        if (dto.selectedFields?.length && source.extractionResult) {
          source.previousExtractionResult = source.extractionResult;
        } else {
          source.previousExtractionResult = undefined;
        }
        source.extractionStatus = 'extracting';
        source.extractionError = undefined;
        source.extractionResult = undefined;
      }

      run.status = RunStatus.EXTRACTING;
      run.finishedAt = null;
      run.error = null;

      const parsedSources = run.sources.filter((s) => s.status === 'parsed');
      const completedExtractions = parsedSources.filter(
        (s) =>
          (s.extractionStatus === 'done' || s.extractionStatus === 'failed') &&
          !sources.includes(s),
      ).length;
      run.progress = {
        ...run.progress!,
        currentStep: 'extracting',
        extracted: completedExtractions,
        extractionTotal: parsedSources.length,
      };

      this.addLog(
        run,
        'info',
        `Batch retry (extraction-only) for ${sources.length} source(s)`,
      );

      if (run.extractionProvider === ExtractionProvider.OLLAMA) {
        await this.runRepo.save(run);
        await this.flushLogs(run.id);

        // Run inline Ollama extraction for each source
        for (const source of sources) {
          try {
            const result = await this.ollamaService.extract(
              source.parsedContent!,
              effectiveSchema,
              extractor?.systemPrompt || '',
              'qwen3:14b',
            );
            source.extractionStatus = 'done';
            source.extractionResult = this.mergeExtractionResult(
              source.previousExtractionResult,
              result.data,
            );
            source.previousExtractionResult = undefined;
            run.progress.extracted = (run.progress.extracted || 0) + 1;
            this.addLog(
              run,
              'info',
              `Extraction for '${source.name}' completed (${result.usage.totalTokens} tokens)`,
            );
          } catch (error) {
            source.extractionStatus = 'failed';
            source.extractionError = error.message;
            run.progress.extracted = (run.progress.extracted || 0) + 1;
            this.addLog(
              run,
              'error',
              `Extraction failed for '${source.name}': ${error.message}`,
            );
          }
          this.runsGateway.emitRunSourceUpdated(run.id, source);
        }

        // Rebuild merged results
        const allResults: Record<string, unknown>[] = [];
        for (const s of run.sources) {
          if (s.extractionStatus === 'done' && s.extractionResult) {
            const annotated = this.annotateResultWithSource(
              s.extractionResult,
              s.name,
            );
            allResults.push(...annotated);
          }
        }
        run.results = allResults.length > 0 ? (allResults as any) : null;
        run.status = allResults.length > 0 ? RunStatus.DONE : RunStatus.FAILED;
        if (!allResults.length) run.error = 'All document extractions failed';
        run.progress.currentStep = 'complete';
        run.finishedAt = new Date();
      } else {
        // Queue-based extraction
        const extractionType =
          run.extractionProvider === ExtractionProvider.LANGEXTRACT
            ? 'langextract'
            : 'llm';

        // For unified mode, combine all source content into one job
        if (run.processingMode === ProcessingMode.UNIFIED) {
          const combinedMarkdown = run.sources
            .map((s) => s.parsedContent)
            .filter(Boolean)
            .join('\n\n');

          await this.queueService.addJob(
            QueueName.EXTRACTION_REQUESTS,
            'extract-data',
            {
              run_id: run.id,
              content: { combined_markdown: combinedMarkdown },
              schema: effectiveSchema,
              system_prompt: extractor?.systemPrompt || '',
              extraction_type: extractionType,
              model_id: 'qwen3:14b',
              examples: extractor?.fewShotExamples || [],
            },
          );
        } else {
          for (const source of sources) {
            await this.queueService.addJob(
              QueueName.EXTRACTION_REQUESTS,
              'extract-data',
              {
                run_id: run.id,
                document_id: source.id,
                source_name: source.name,
                content: { combined_markdown: source.parsedContent },
                schema: effectiveSchema,
                system_prompt: extractor?.systemPrompt || '',
                extraction_type: extractionType,
                model_id: 'qwen3:14b',
                examples: extractor?.fewShotExamples || [],
              },
            );
          }
        }

        this.addLog(
          run,
          'info',
          `Extraction jobs queued for ${sources.length} source(s)`,
        );
      }

      await this.runRepo.save(run);
      await this.flushLogs(run.id);
    }

    const freshRun = await this.runRepo.findOne({
      where: { id: run.id },
      relations: ['extractor'],
    });
    const runToEmit = freshRun || run;

    this.runsGateway.emitRunUpdated(run.id, runToEmit);
    for (const source of sources) {
      this.runsGateway.emitRunSourceUpdated(run.id, source);
    }
    this.runsGateway.emitRunsListUpdated({
      runId: run.id,
      status: runToEmit.status,
      progress: runToEmit.progress,
    });

    return runToEmit;
  }

  async remove(id: string, userId: string) {
    const run = await this.findOne(id, userId);
    // Cancel any in-flight or queued jobs for this run
    await this.queueService.removeJobsForRun(QueueName.UPLOADED_DOCUMENTS, id);
    await this.queueService.removeJobsForRun(QueueName.EXTRACTION_REQUESTS, id);
    return this.runRepo.remove(run);
  }
}
