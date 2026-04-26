import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Extractor } from '../extractors/entities/extractor.entity';
import { Run } from '../runs/entities/run.entity';

export interface BackupListItem {
  filename: string;
  createdAt: string;
  sizeBytes: number;
}

interface BackupBundle {
  version: 1;
  exportedAt: string;
  extractors: Record<string, unknown>[];
  runs: Record<string, unknown>[];
}

export interface ImportResult {
  extractors: { imported: number; updated: number; skipped: number };
  runs: { imported: number; updated: number; skipped: number };
  errors: string[];
}

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly localDir: string;

  constructor(
    @InjectRepository(Extractor)
    private readonly extractorRepo: Repository<Extractor>,
    @InjectRepository(Run)
    private readonly runRepo: Repository<Run>,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>('BACKUP_MINIO_BUCKET', 'backups');
    this.localDir = this.config.get<string>(
      'BACKUP_LOCAL_DIR',
      join(process.cwd(), 'backups'),
    );

    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint:
        this.config.get<string>('MINIO_ENDPOINT') || 'http://minio:9000',
      forcePathStyle: true,
      credentials: {
        accessKeyId:
          this.config.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey:
          this.config.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
      },
    });
  }

  onModuleInit() {
    if (!existsSync(this.localDir)) {
      mkdirSync(this.localDir, { recursive: true });
    }
    this.ensureBucket().catch((err) =>
      this.logger.warn(`Bucket init failed: ${err.message}`),
    );
  }

  private async ensureBucket() {
    const { CreateBucketCommand, HeadBucketCommand } = await import(
      '@aws-sdk/client-s3'
    );
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created MinIO bucket: ${this.bucket}`);
    }
  }

  async createBackup(): Promise<{ filename: string; buffer: Buffer }> {
    const [extractors, runs] = await Promise.all([
      this.extractorRepo.find(),
      this.runRepo.find(),
    ]);

    const bundle: BackupBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      extractors: extractors as unknown as Record<string, unknown>[],
      runs: runs as unknown as Record<string, unknown>[],
    };

    const json = JSON.stringify(bundle, null, 2);
    const buffer = Buffer.from(json, 'utf-8');
    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    const localPath = join(this.localDir, filename);

    // Save locally
    writeFileSync(localPath, buffer);

    // Save to MinIO
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: buffer,
        ContentType: 'application/json',
      }),
    );

    this.logger.log(`Backup created: ${filename} (${buffer.length} bytes)`);
    return { filename, buffer };
  }

  async listBackups(): Promise<BackupListItem[]> {
    const res = await this.s3.send(
      new ListObjectsV2Command({ Bucket: this.bucket }),
    );

    const items: BackupListItem[] = (res.Contents ?? [])
      .filter((o) => o.Key && o.Key.endsWith('.json'))
      .map((o) => ({
        filename: o.Key!,
        createdAt: (o.LastModified ?? new Date()).toISOString(),
        sizeBytes: o.Size ?? 0,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return items;
  }

  async downloadBackup(filename: string): Promise<Buffer> {
    const res = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: filename }),
    );
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteBackup(filename: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }),
    );
    const localPath = join(this.localDir, filename);
    if (existsSync(localPath)) unlinkSync(localPath);
    this.logger.log(`Deleted backup: ${filename}`);
  }

  async importBackup(buffer: Buffer): Promise<ImportResult> {
    let bundle: BackupBundle;
    try {
      bundle = JSON.parse(buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON backup file');
    }

    if (bundle.version !== 1) {
      throw new BadRequestException(
        `Unsupported backup version: ${bundle.version}`,
      );
    }

    const result: ImportResult = {
      extractors: { imported: 0, updated: 0, skipped: 0 },
      runs: { imported: 0, updated: 0, skipped: 0 },
      errors: [],
    };

    for (const raw of bundle.extractors ?? []) {
      try {
        const existing = raw.id
          ? await this.extractorRepo.findOne({
              where: { id: raw.id as string },
            })
          : null;

        // Strip unknown fields by picking only known columns
        const columns = this.extractorRepo.metadata.columns.map(
          (c) => c.propertyName,
        );
        const safe: Record<string, unknown> = {};
        for (const col of columns) {
          if (raw[col] !== undefined) safe[col] = raw[col];
        }

        // Null out userId if it doesn't exist on this instance
        if (safe.userId) {
          safe.userId = null;
        }

        await this.extractorRepo.save(safe);
        if (existing) {
          result.extractors.updated++;
        } else {
          result.extractors.imported++;
        }
      } catch (err: any) {
        result.extractors.skipped++;
        result.errors.push(`Extractor ${raw.id}: ${err.message}`);
      }
    }

    for (const raw of bundle.runs ?? []) {
      try {
        const existing = raw.id
          ? await this.runRepo.findOne({ where: { id: raw.id as string } })
          : null;

        const columns = this.runRepo.metadata.columns.map(
          (c) => c.propertyName,
        );
        const safe: Record<string, unknown> = {};
        for (const col of columns) {
          if (raw[col] !== undefined) safe[col] = raw[col];
        }

        if (safe.userId) {
          safe.userId = null;
        }

        await this.runRepo.save(safe);
        if (existing) {
          result.runs.updated++;
        } else {
          result.runs.imported++;
        }
      } catch (err: any) {
        result.runs.skipped++;
        result.errors.push(`Run ${raw.id}: ${err.message}`);
      }
    }

    this.logger.log(
      `Import complete: extractors=${JSON.stringify(result.extractors)}, runs=${JSON.stringify(result.runs)}`,
    );
    return result;
  }

  async syncToGoogleDrive(): Promise<void> {
    const remote = this.config.get<string>('RCLONE_REMOTE');
    if (!remote) return;

    const destPath = this.config.get<string>(
      'RCLONE_DEST_PATH',
      'docxtractor-backups',
    );
    try {
      execFileSync('rclone', ['copy', this.localDir, `${remote}:${destPath}`], {
        timeout: 300_000,
      });
      this.logger.log(`rclone sync complete → ${remote}:${destPath}`);
    } catch (err: any) {
      this.logger.warn(`rclone sync failed: ${err.message}`);
    }
  }

  async applyRetention(): Promise<void> {
    const all = await this.listBackups();
    const toKeep = new Set<string>();

    // Parse date from filename "backup-YYYY-MM-DD.json"
    const dated = all
      .map((b) => {
        const match = b.filename.match(/backup-(\d{4}-\d{2}-\d{2})\.json/);
        return match ? { ...b, date: new Date(match[1]) } : null;
      })
      .filter(Boolean) as (BackupListItem & { date: Date })[];

    // Sort newest first
    dated.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Keep 7 most recent dailies
    dated.slice(0, 7).forEach((b) => toKeep.add(b.filename));

    // Keep 4 most recent Sundays (day=0)
    const sundays = dated.filter((b) => b.date.getDay() === 0);
    sundays.slice(0, 4).forEach((b) => toKeep.add(b.filename));

    // Keep 3 most recent 1st-of-month
    const firsts = dated.filter((b) => b.date.getDate() === 1);
    firsts.slice(0, 3).forEach((b) => toKeep.add(b.filename));

    for (const b of dated) {
      if (!toKeep.has(b.filename)) {
        await this.deleteBackup(b.filename);
        this.logger.log(`Retention: deleted ${b.filename}`);
      }
    }
  }
}
