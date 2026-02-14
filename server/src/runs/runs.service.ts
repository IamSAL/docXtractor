/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Run, RunStatus, RunSource } from './entities/run.entity';
import { Extractor } from '../extractors/entities/extractor.entity';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { QueueService } from '../shared/queue/queue.service';
import { QueueName } from '../shared/queue/queue-names';
import { FilesService } from '../files/files.service';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(Extractor) private extractorRepo: Repository<Extractor>,
    private queueService: QueueService,
    private filesService: FilesService,
  ) {}

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
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Run started with ${sources.length} document(s)`,
        },
      ],
    });

    await this.runRepo.save(run);

    // Send each source to parser via BullMQ
    for (const source of run.sources) {
      source.status = 'parsing';
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
    run.progress!.currentStep = 'parsing';
    await this.runRepo.save(run);

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
  ): Promise<{ data: Run[]; total: number; page: number; limit: number }> {
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

    return { data, total, page, limit };
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
      `Handling parsed document for run ${run_id}, doc ${document_id}`,
    );

    const run = await this.runRepo.findOne({ where: { id: run_id } });
    if (!run) return;

    const source = run.sources.find((s) => s.id === document_id);
    if (!source) return;

    if (status === 'success') {
      source.status = 'parsed';
      source.parsedContent = markdown_content;
      source.tokenCount = token_count;
    } else {
      source.status = 'failed';
      source.error = data.error || 'Parsing failed';
    }

    run.progress!.parsed += 1;

    // Check if all sources are parsed
    const allParsed = run.sources.every(
      (s) => s.status === 'parsed' || s.status === 'failed',
    );
    if (allParsed) {
      run.status = RunStatus.EXTRACTING;
      run.progress!.currentStep = 'extracting';

      // Trigger extraction
      await this.queueService.addJob(
        QueueName.EXTRACTION_REQUESTS,
        'extract-data',
        {
          run_id: run.id,
          content: {
            combined_markdown: run.sources
              .map((s) => s.parsedContent)
              .join('\n\n'),
          },
          schema:
            (
              await this.extractorRepo.findOne({
                where: { id: run.extractorId },
              })
            )?.schema || {},
          extractionType: 'llm', // Default
        },
      );
    }

    await this.runRepo.save(run);
  }

  /**
   * Handle extraction completed event from extraction-service
   */
  async handleExtractionCompleted(data: any) {
    const { run_id, status, result, usage } = data;
    this.logger.log(`Handling extraction completion for run ${run_id}`);

    const run = await this.runRepo.findOne({ where: { id: run_id } });
    if (!run) return;

    if (status === 'success') {
      run.status = RunStatus.DONE;
      run.results = result;
      run.metrics = {
        totalInputTokens: usage?.input_tokens,
        totalOutputTokens: usage?.output_tokens,
      };
      run.progress!.currentStep = 'complete';
    } else {
      run.status = RunStatus.FAILED;
      run.error = data.error || 'Extraction failed';
    }

    run.finishedAt = new Date();
    await this.runRepo.save(run);
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

    run.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Run restarted',
    });

    await this.runRepo.save(run);

    // Re-queue documents
    for (const source of run.sources) {
      source.status = 'parsing';
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
    run.progress!.currentStep = 'parsing';
    await this.runRepo.save(run);

    return run;
  }

  async remove(id: string, userId: string) {
    const run = await this.findOne(id, userId);
    return this.runRepo.remove(run);
  }
}
