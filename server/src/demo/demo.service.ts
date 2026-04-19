import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { DemoSession } from './entities/demo-session.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { Extractor } from '../extractors/entities/extractor.entity';
import { UserRole } from '../user/entities/user.entity';
import { LlmService } from '../shared/llm/llm.service';
import { FilesService } from '../files/files.service';
import { StorageService } from '../files/storage.service';
import { File } from '../files/entities/file.entity';
import { RunsService } from '../runs/runs.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Run } from '../runs/entities/run.entity';

@Injectable()
export class DemoService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoService.name);
  private demoUserId: string | null = null;

  constructor(
    @InjectRepository(DemoSession)
    private readonly demoSessionRepo: Repository<DemoSession>,
    @InjectRepository(Extractor)
    private readonly extractorRepo: Repository<Extractor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Run)
    private readonly runRepo: Repository<Run>,
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    private readonly userService: UserService,
    private readonly llmService: LlmService,
    private readonly filesService: FilesService,
    private readonly storageService: StorageService,
    private readonly runsService: RunsService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const email = 'demo@docxtractor.internal';
      let user = await this.userService.findByEmail(email);

      if (!user) {
        // Create via UserService (password: undefined skips @BeforeInsert hash)
        user = await this.userService.create({
          email,
          role: UserRole.USER,
        });
        // Set isEmailVerified directly (not in CreateUserDto)
        await this.userRepo.update(user.id, { isEmailVerified: true });
        this.logger.log(`Demo user created: ${user.id}`);
      }

      this.demoUserId = user.id;
      this.logger.log(`Demo user ready: ${this.demoUserId}`);
    } catch (error) {
      this.logger.warn(
        'Failed to seed demo user. Demo endpoints will return 503.',
        error,
      );
      this.demoUserId = null;
    }
  }

  getDemoUserId(): string {
    if (!this.demoUserId) {
      throw new ServiceUnavailableException(
        'Demo service is not available. Demo user could not be initialized.',
      );
    }
    return this.demoUserId;
  }

  async getOrCreateSession(fingerprint: string): Promise<DemoSession> {
    await this.demoSessionRepo
      .createQueryBuilder()
      .insert()
      .into(DemoSession)
      .values({ fingerprint })
      .orIgnore()
      .execute();
    return this.demoSessionRepo.findOne({
      where: { fingerprint },
    }) as Promise<DemoSession>;
  }

  async getSession(fingerprint: string): Promise<DemoSession | null> {
    return this.demoSessionRepo.findOne({ where: { fingerprint } });
  }

  checkRunAllowed(session: DemoSession): {
    allowed: boolean;
    reason?: string;
  } {
    if (session.runsUsed >= 5) {
      return { allowed: false, reason: 'limit_reached' };
    }
    if (session.runsUsed >= 1 && !session.email) {
      return { allowed: false, reason: 'email_required' };
    }
    return { allowed: true };
  }

  async incrementRunsUsed(fingerprint: string): Promise<void> {
    // Atomic increment to handle concurrent requests
    await this.demoSessionRepo
      .createQueryBuilder()
      .update(DemoSession)
      .set({ runsUsed: () => '"runsUsed" + 1' })
      .where('fingerprint = :fingerprint', { fingerprint })
      .execute();
  }

  async captureEmail(fingerprint: string, email: string): Promise<DemoSession> {
    const session = await this.getOrCreateSession(fingerprint);
    session.email = email;
    return this.demoSessionRepo.save(session);
  }

  // --- Auto-classification ---

  classifyByFilename(filename: string): string {
    const lower = filename.toLowerCase();
    if (/invoice|bill|receipt|payment/.test(lower)) return 'Invoice';
    if (/agreement|contract|nda|terms/.test(lower)) return 'Contract';
    if (/resume|cv|curriculum/.test(lower)) return 'Resume';
    return 'Generic Form';
  }

  async classifyDocument(filename: string): Promise<{
    suggestedType: string;
    method: 'heuristic' | 'llm';
  }> {
    const heuristic = this.classifyByFilename(filename);
    if (heuristic !== 'Generic Form') {
      return { suggestedType: heuristic, method: 'heuristic' };
    }

    // LLM fallback
    try {
      const result = await this.llmService.generate(
        `Classify this document based on its filename. Return JSON: {"type": "Invoice"} or {"type": "Contract"} or {"type": "Resume"} or {"type": "Generic Form"}.\n\nFilename: "${filename}"`,
      );
      const type = (result as any)?.type || 'Generic Form';
      // Validate against known types
      const validTypes = ['Invoice', 'Contract', 'Resume', 'Generic Form'];
      const matched = validTypes.find((t) =>
        type.toLowerCase().includes(t.toLowerCase()),
      );
      return {
        suggestedType: matched || 'Generic Form',
        method: 'llm',
      };
    } catch (error) {
      this.logger.warn(
        'LLM classification failed, falling back to Generic Form',
        error,
      );
      return { suggestedType: 'Generic Form', method: 'heuristic' };
    }
  }

  async findPublicExtractorByType(
    suggestedType: string,
  ): Promise<Extractor | null> {
    return this.extractorRepo.findOne({
      where: { isPublic: true, name: suggestedType },
    });
  }

  async getPublicExtractors(): Promise<Extractor[]> {
    return this.extractorRepo.find({
      where: { isPublic: true },
      select: ['id', 'name', 'description'],
    });
  }

  // --- File upload ---

  async uploadDemoFile(
    file: Express.Multer.File,
  ): Promise<{ id: string; url: string; storageKey: string }> {
    const demoUserId = this.getDemoUserId();
    return this.filesService.uploadFile(
      demoUserId,
      file,
      { demo: true },
      'demo/',
    );
  }

  // --- Run creation ---

  async createDemoRun(
    fingerprint: string,
    extractorId: string,
    sources: { fileId: string; name: string }[],
  ): Promise<{ run: Run; demoToken: string }> {
    const demoUserId = this.getDemoUserId();
    const session = await this.getOrCreateSession(fingerprint);

    // Check run allowed
    const check = this.checkRunAllowed(session);
    if (!check.allowed) {
      throw new ForbiddenException(
        check.reason === 'email_required'
          ? 'Email required to continue demo'
          : 'Demo run limit reached (5 runs)',
      );
    }

    // Verify extractor is public
    await this.checkExtractorIsPublic(extractorId);

    // Create run via RunsService (it resolves fileKey from fileId internally)
    const runSources = sources.map((s) => ({
      type: 'file' as const,
      name: s.name,
      fileId: s.fileId,
    }));

    const run = await this.runsService.create(
      {
        extractorId,
        sources: runSources,
      },
      demoUserId,
    );

    // Mark as demo run
    await this.runRepo.update(run.id, { isDemo: true });

    // Atomic increment
    await this.incrementRunsUsed(fingerprint);

    // Sign demoToken
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const demoToken = this.jwtService.sign(
      { runId: run.id, type: 'demo' },
      { secret, expiresIn: '30m' },
    );

    return { run, demoToken };
  }

  // --- Result ---

  async getDemoResult(runId: string): Promise<Run> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    if (!run.isDemo) {
      throw new ForbiddenException('Not a demo run');
    }
    return run;
  }

  async checkExtractorIsPublic(extractorId: string): Promise<Extractor> {
    const extractor = await this.extractorRepo.findOne({
      where: { id: extractorId },
    });

    if (!extractor) {
      throw new NotFoundException('Extractor not found');
    }

    if (!extractor.isPublic) {
      throw new ForbiddenException(
        'This extractor is not available for demo use',
      );
    }

    return extractor;
  }

  // --- Cron cleanup ---

  @Cron('0 3 * * *')
  async cleanupDemoFiles(): Promise<void> {
    this.logger.log('Running demo file cleanup...');
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);

      const oldFiles = await this.fileRepo.find({
        where: {
          storageKey: Like('demo/%'),
          createdAt: LessThan(cutoff),
        },
      });

      for (const file of oldFiles) {
        try {
          await this.storageService.deleteObject(file.storageKey);
          await this.fileRepo.delete(file.id);
        } catch (err) {
          this.logger.warn(
            `Failed to delete demo file ${file.id}: ${err.message}`,
          );
        }
      }
      this.logger.log(`Cleaned up ${oldFiles.length} demo files`);
    } catch (err) {
      this.logger.error('Demo file cleanup failed', err);
    }
  }
}
