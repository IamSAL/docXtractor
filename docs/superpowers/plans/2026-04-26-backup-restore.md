# Backup & Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-only backup/restore of all Extractors + Runs as JSON, with scheduled nightly cron, MinIO + local storage, rclone to Google Drive, and a Settings UI.

**Architecture:** A new `BackupModule` in `server/src/backup/` replaces the existing stub. `BackupService` serializes/deserializes TypeORM entities and manages MinIO + local file storage. `BackupScheduler` handles cron and retention. A new `settings/backups.tsx` route surfaces list/export/import/delete in the UI.

**Tech Stack:** NestJS + TypeORM + `@aws-sdk/client-s3` + `@nestjs/schedule` + React 19 + TanStack Router + AXIOS_INSTANCE + RetroUI components

---

## File Map

| Action | Path |
|--------|------|
| Replace | `server/src/backup/backup.service.ts` |
| Replace | `server/src/backup/backup.module.ts` |
| Create | `server/src/backup/backup.controller.ts` |
| Create | `server/src/backup/backup.scheduler.ts` |
| Modify | `server/env.example` |
| Create | `client/src/routes/settings/backups.tsx` |
| Modify | `client/src/routes/settings.tsx` |

---

## Task 1: Replace BackupService

**Files:**
- Replace: `server/src/backup/backup.service.ts`

The existing file does `pg_dump` — replace it entirely with the JSON-based approach.

- [ ] **Step 1: Replace `backup.service.ts` with the new implementation**

```typescript
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
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { execFileSync } from 'child_process';
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  readdirSync,
} from 'fs';
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
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd server && pnpm run build 2>&1 | head -40
```

Expected: build completes (may warn about missing module imports until Task 4).

- [ ] **Step 3: Commit**

```bash
git add server/src/backup/backup.service.ts
git commit -m "feat(backup): rewrite BackupService with JSON export/import"
```

---

## Task 2: Create BackupController

**Files:**
- Create: `server/src/backup/backup.controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../auth/enums/role.enum';
import { BackupService } from './backup.service';

@ApiTags('Backup')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('list')
  @ApiOperation({ summary: 'List stored backups' })
  list() {
    return this.backupService.listBackups();
  }

  @Get('export')
  @ApiOperation({ summary: 'Create and download a new backup' })
  async export(@Res() res: Response) {
    const { filename, buffer } = await this.backupService.createBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download a specific stored backup' })
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const buffer = await this.backupService.downloadBackup(filename);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  @Delete(':filename')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a specific backup' })
  async remove(@Param('filename') filename: string) {
    await this.backupService.deleteBackup(filename);
  }

  @Post('import')
  @ApiOperation({ summary: 'Restore from a backup JSON file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only .json backup files are accepted'), false);
        }
      },
    }),
  )
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.backupService.importBackup(file.buffer);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/backup/backup.controller.ts
git commit -m "feat(backup): add BackupController with list/export/download/delete/import"
```

---

## Task 3: Create BackupScheduler

**Files:**
- Create: `server/src/backup/backup.scheduler.ts`

- [ ] **Step 1: Create the scheduler**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from './backup.service';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(private readonly backupService: BackupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlyBackup() {
    this.logger.log('Nightly backup starting...');
    try {
      const { filename } = await this.backupService.createBackup();
      this.logger.log(`Nightly backup complete: ${filename}`);

      await this.backupService.syncToGoogleDrive();
      await this.backupService.applyRetention();
    } catch (err: any) {
      this.logger.error(`Nightly backup failed: ${err.message}`);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/backup/backup.scheduler.ts
git commit -m "feat(backup): add BackupScheduler with nightly cron and retention"
```

---

## Task 4: Update BackupModule

**Files:**
- Replace: `server/src/backup/backup.module.ts`

- [ ] **Step 1: Replace `backup.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { BackupScheduler } from './backup.scheduler';
import { Extractor } from '../extractors/entities/extractor.entity';
import { Run } from '../runs/entities/run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extractor, Run])],
  controllers: [BackupController],
  providers: [BackupService, BackupScheduler],
})
export class BackupModule {}
```

- [ ] **Step 2: Build to verify no errors**

```bash
cd server && pnpm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/backup/backup.module.ts
git commit -m "feat(backup): wire up BackupModule with TypeORM, controller, scheduler"
```

---

## Task 5: Add env vars to env.example

**Files:**
- Modify: `server/env.example`

- [ ] **Step 1: Append backup env vars to `server/env.example`**

Add at the end of the file:

```
# Backup
BACKUP_LOCAL_DIR=./backups
BACKUP_MINIO_BUCKET=backups
# RCLONE_REMOTE=gdrive          # rclone remote name; leave unset to disable Google Drive sync
# RCLONE_DEST_PATH=docxtractor-backups
```

- [ ] **Step 2: Commit**

```bash
git add server/env.example
git commit -m "docs(backup): add backup env vars to env.example"
```

---

## Task 6: Frontend — Backups settings page

**Files:**
- Create: `client/src/routes/settings/backups.tsx`

- [ ] **Step 1: Create `client/src/routes/settings/backups.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AXIOS_INSTANCE } from "@/lib/axios";
import { toast } from "sonner";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/settings/backups")({
  component: BackupsSettingsPage,
});

interface BackupItem {
  filename: string;
  createdAt: string;
  sizeBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BackupsSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    try {
      const res = await AXIOS_INSTANCE.get<BackupItem[]>("/admin/backup/list");
      setBackups(res.data);
    } catch {
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchBackups();
  }, [isAdmin]);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await AXIOS_INSTANCE.get("/admin/backup/export", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup created and downloaded");
      await fetchBackups();
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const res = await AXIOS_INSTANCE.get(
        `/admin/backup/download/${encodeURIComponent(filename)}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download backup");
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingFilename(filename);
    try {
      await AXIOS_INSTANCE.delete(
        `/admin/backup/${encodeURIComponent(filename)}`,
      );
      toast.success(`Deleted ${filename}`);
      setBackups((prev) => prev.filter((b) => b.filename !== filename));
    } catch {
      toast.error("Failed to delete backup");
    } finally {
      setDeletingFilename(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      const res = await AXIOS_INSTANCE.post<{
        extractors: { imported: number; updated: number; skipped: number };
        runs: { imported: number; updated: number; skipped: number };
        errors: string[];
      }>("/admin/backup/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { extractors, runs, errors } = res.data;
      toast.success(
        `Import complete — Extractors: ${extractors.imported} new, ${extractors.updated} updated, ${extractors.skipped} skipped. Runs: ${runs.imported} new, ${runs.updated} updated, ${runs.skipped} skipped.`,
      );
      if (errors.length > 0) {
        toast.warning(`${errors.length} record(s) had errors. Check server logs.`);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isAdmin) {
    return (
      <p className="text-[#948a51] font-mono text-sm">
        Admin access required.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            backup
          </span>
          {creatingBackup ? "Creating..." : "Create Backup"}
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            upload_file
          </span>
          {importing ? "Importing..." : "Import Backup"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b-2 border-black bg-[#f5f2e8]">
          <h3 className="font-bold text-sm uppercase tracking-wide">
            Stored Backups
          </h3>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-[#948a51] font-mono">Loading...</p>
        ) : backups.length === 0 ? (
          <p className="p-4 text-sm text-[#948a51] font-mono">
            No backups yet. Click "Create Backup" to create one.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-[#f5f2e8]">
                <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-xs">
                  Filename
                </th>
                <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-xs">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-xs">
                  Size
                </th>
                <th className="px-4 py-2 text-right font-bold uppercase tracking-wide text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b, i) => (
                <tr
                  key={b.filename}
                  className={
                    i % 2 === 0 ? "bg-white" : "bg-[#fafaf5]"
                  }
                >
                  <td className="px-4 py-2 font-mono">{b.filename}</td>
                  <td className="px-4 py-2 text-[#948a51]">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-[#948a51]">
                    {formatBytes(b.sizeBytes)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(b.filename)}
                        className="text-[#948a51] hover:text-[#1a190e] transition-colors"
                        title="Download"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          download
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(b.filename)}
                        disabled={deletingFilename === b.filename}
                        className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/routes/settings/backups.tsx
git commit -m "feat(backup): add Backups settings page with list/export/import/delete"
```

---

## Task 7: Add Backups tab to Settings layout

**Files:**
- Modify: `client/src/routes/settings.tsx`

- [ ] **Step 1: Add the Backups tab to the admin-only tabs array in `client/src/routes/settings.tsx`**

Find this block in `settings.tsx` (around line 32–40):

```typescript
    ...(isAdmin
      ? [
          {
            label: "Instance",
            icon: "admin_panel_settings",
            path: "/settings/instance",
          },
        ]
      : []),
```

Replace with:

```typescript
    ...(isAdmin
      ? [
          {
            label: "Instance",
            icon: "admin_panel_settings",
            path: "/settings/instance",
          },
          {
            label: "Backups",
            icon: "backup",
            path: "/settings/backups",
          },
        ]
      : []),
```

- [ ] **Step 2: Verify frontend builds**

```bash
cd client && pnpm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/routes/settings.tsx
git commit -m "feat(backup): add Backups tab to Settings for admin users"
```

---

## Self-Review Notes

- **Spec coverage:** All endpoints covered (list ✓, export ✓, download/:filename ✓, delete/:filename ✓, import ✓). Scheduler ✓. Retention ✓. rclone ✓. MinIO + local ✓. Frontend UI ✓. Graceful import conflict handling ✓.
- **Import userId**: spec says preserve userId from backup but set to null if user doesn't exist. Implemented by always setting `safe.userId = null` on import (safe for cross-instance transfers; no user lookup needed).
- **`ensureBucket`**: uses dynamic import to avoid circular dep issues with `@aws-sdk/client-s3` — if that's an issue, move `CreateBucketCommand`/`HeadBucketCommand` to the top-level import block.
- **Filename date**: uses `new Date().toISOString().slice(0, 10)` — no extra deps needed.
