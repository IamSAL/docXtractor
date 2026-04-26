# Backup & Restore Design

**Date:** 2026-04-26
**Status:** Approved

## Overview

Full-site backup and restore of Extractors + Runs (no users, no MinIO file blobs). Backups are stored locally in `./backups/`, in a dedicated MinIO bucket, and optionally synced to Google Drive via rclone. A nightly cron applies a rolling retention policy.

## Scope

**Included in backup:**
- All `Extractor` records (schema, systemPrompt, fewShotExamples, variants, all config fields)
- All `Run` records (sources, results, metrics, logs, status, all fields)

**Excluded:**
- `User` records
- Uploaded files in MinIO (binary blobs)
- Instance settings
- Invites

## Architecture

### New module: `server/src/backup/`

```
server/src/backup/
├── backup.module.ts
├── backup.service.ts       # serialize/deserialize + storage + rclone
├── backup.controller.ts    # API endpoints
└── backup.scheduler.ts     # @nestjs/schedule cron + retention
```

### BackupService

Responsibilities:
- Serialize all extractors + runs via TypeORM repositories into a single JSON structure
- Deserialize and upsert on import (upsert by `id` to avoid duplicates on re-import)
- Write backup file to `./backups/backup-YYYY-MM-DD.json` and MinIO bucket `backups`
- `syncToGoogleDrive(localPath)`: shells out `rclone copy <localPath> <RCLONE_REMOTE>:<RCLONE_DEST_PATH>`

**Backup JSON format:**
```json
{
  "version": 1,
  "exportedAt": "2026-04-26T00:00:00.000Z",
  "extractors": [...],
  "runs": [...]
}
```

### BackupController

All routes are `@Roles('admin')` only.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/backup/list` | List stored backups `{ filename, createdAt, sizeBytes }[]` |
| GET | `/admin/backup/export` | Create + download new backup as `application/json` attachment (saves to storage too) |
| GET | `/admin/backup/download/:filename` | Download a specific stored backup from MinIO |
| DELETE | `/admin/backup/:filename` | Delete a specific backup from MinIO + local |
| POST | `/admin/backup/import` | Multipart upload — restore from JSON |

### BackupScheduler

- Runs nightly via `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`
- Creates backup, writes to both MinIO and `./backups/`
- Syncs `./backups/` to Google Drive via rclone (if `RCLONE_REMOTE` is set)
- Applies retention: scan all backups by date, keep 7 most recent dailies + 4 most recent Sundays + 3 most recent 1st-of-months, delete rest from both MinIO and local

## Frontend

Settings page gets a **Backups** section:

**Top action bar:**
- "Create Backup" — POST to export endpoint, triggers browser download
- "Import Backup" — file picker → POST `/admin/backup/import`

**Backup list table:**
- Columns: Filename, Date, Size, Actions
- Row actions: Download (fetches from MinIO via `/admin/backup/download/:filename`), Delete

API client regenerated via `pnpm run gen:api` after backend changes.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_LOCAL_DIR` | `./backups` | Local directory for backup files |
| `BACKUP_MINIO_BUCKET` | `backups` | MinIO bucket name |
| `RCLONE_REMOTE` | _(unset)_ | rclone remote name (e.g. `gdrive`). If unset, rclone sync is skipped |
| `RCLONE_DEST_PATH` | `docxtractor-backups` | Destination path on the rclone remote |

## Retention Policy

Run after each nightly backup. Steps:
1. List all backups sorted by date descending
2. Mark as "keep": 7 most recent (daily), 4 most recent that fall on Sunday (weekly), 3 most recent that fall on the 1st of a month (monthly)
3. Delete everything not marked "keep" from MinIO + local

## Import Behavior

- Parse and validate JSON (check `version` field)
- Upsert extractors by `id` (insert if not exists, update if exists). `userId` from the backup is preserved as-is; if the user doesn't exist on this instance, it is set to `null`.
- Upsert runs by `id`. Same `userId` rule applies.
- **DB structure conflict handling**: unknown fields in the backup JSON are silently ignored. Missing fields (present in DB schema but absent in backup) fall back to column defaults. Each record is wrapped in a try/catch — a single record failure is logged and counted as `skipped`, never aborts the full import.
- Return `{ extractors: { imported, updated, skipped }, runs: { imported, updated, skipped } }` summary with per-record errors in a `errors[]` array for inspection.
