import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { execSync, execFileSync } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { join } from 'path';

interface DbConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

type BackupTier = 'hourly' | 'daily' | 'weekly' | 'monthly';

const RETENTION: Record<BackupTier, number> = {
  hourly: 24,
  daily: 7,
  weekly: 4,
  monthly: 12,
};

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly enabled: boolean;
  private readonly remote: string;
  private readonly remotePath: string;
  private readonly baseDir = '/tmp/docxtractor-backups';
  private db!: DbConfig;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>('BACKUP_ENABLED', 'false') === 'true';
    this.remote = this.configService.get<string>(
      'BACKUP_GDRIVE_REMOTE',
      'gdrive',
    );
    this.remotePath = this.configService.get<string>(
      'BACKUP_GDRIVE_PATH',
      'docxtractor-backups',
    );
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Backup system disabled (BACKUP_ENABLED != true)');
      return;
    }

    this.db = this.parseDatabaseUrl(
      this.configService.get<any>('DATABASE_URL'),
    );

    for (const tier of Object.keys(RETENTION) as BackupTier[]) {
      const dir = join(this.baseDir, tier);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    }

    this.logger.log(`Backup system active → ${this.remote}:${this.remotePath}`);
  }

  // @Cron('0 * * * *')
  // handleHourly() {
  //   this.runBackup('hourly');
  // }

  @Cron('0 0 * * *')
  handleDaily() {
    this.runBackup('daily');
  }

  @Cron('0 0 * * 0')
  handleWeekly() {
    this.runBackup('weekly');
  }

  @Cron('0 0 1 * *')
  handleMonthly() {
    this.runBackup('monthly');
  }

  private runBackup(tier: BackupTier) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `docxtractor-${timestamp}.sql.gz`;
    const localDir = join(this.baseDir, tier);
    const localPath = join(localDir, filename);

    try {
      this.logger.log(`[${tier}] Starting backup...`);

      // pg_dump → gzip (execFileSync avoids shell injection from DB config values)
      const dumpBuffer = execFileSync(
        'pg_dump',
        ['-h', this.db.host, '-p', this.db.port, '-U', this.db.user, '-d', this.db.database],
        { env: { ...process.env, PGPASSWORD: this.db.password }, timeout: 120_000 },
      );
      writeFileSync(localPath, gzipSync(dumpBuffer));
      this.logger.log(`[${tier}] Dump complete: ${filename}`);

      // Upload to Google Drive
      const remoteDest = `${this.remote}:${this.remotePath}/${tier}/`;
      execSync(`rclone copy "${localPath}" "${remoteDest}"`, {
        stdio: 'pipe',
        timeout: 300_000,
      });
      this.logger.log(`[${tier}] Uploaded to ${remoteDest}`);

      // Delete local file (temp only)
      unlinkSync(localPath);

      // Prune old backups on remote
      this.pruneRemote(tier);

      this.logger.log(`[${tier}] Backup complete`);
    } catch (err: any) {
      this.logger.error(`[${tier}] Backup failed: ${err.message}`);
      // Clean up local file on failure
      if (existsSync(localPath)) unlinkSync(localPath);
    }
  }

  private pruneRemote(tier: BackupTier) {
    const keep = RETENTION[tier];
    const remoteDest = `${this.remote}:${this.remotePath}/${tier}`;

    try {
      const output = execSync(`rclone lsf "${remoteDest}" --files-only`, {
        encoding: 'utf-8',
        timeout: 60_000,
      });

      const files = output.trim().split('\n').filter(Boolean).sort().reverse(); // newest first (ISO timestamps sort lexicographically)

      if (files.length <= keep) return;

      const toDelete = files.slice(keep);
      for (const file of toDelete) {
        execSync(`rclone deletefile "${remoteDest}/${file}"`, {
          stdio: 'pipe',
          timeout: 60_000,
        });
        this.logger.log(`[${tier}] Pruned: ${file}`);
      }
    } catch (err: any) {
      this.logger.warn(`[${tier}] Prune failed: ${err.message}`);
    }
  }

  private parseDatabaseUrl(url: string): DbConfig {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace('/', ''),
    };
  }
}
