# First Source Stuck — Race Condition Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the race condition where the first source in a multi-file run gets permanently stuck in "parsing" or "extracting" status.

**Architecture:** Jobs are dispatched to BullMQ *before* the DB is updated to reflect the new status. Workers can complete and push completion events before the DB has the expected status. The completion handler in `_handleDocumentParsedLocked()` guards against stale events by checking `source.status === 'pending'` — which is a valid guard but fires *incorrectly* during the creation window because the save with `'parsing'` hasn't happened yet. Fix: persist the `'parsing'` / `'extracting'` status to DB **before** enqueuing any jobs.

**Tech Stack:** NestJS, TypeORM, BullMQ, PostgreSQL

---

## Root Cause Summary

All three affected paths share the same pattern:
1. Source status mutated in-memory (e.g. `source.status = 'parsing'`)
2. Job queued immediately → worker can pick it up and complete *before step 3*
3. DB saved with new status — **too late**

The completion handler `_handleDocumentParsedLocked()` reads from DB at arrival time. If DB still shows `'pending'`, it drops the event at line 471-475 — permanently.

---

## Files Modified

- Modify: `server/src/runs/runs.service.ts`
  - `create()` — lines 307-361: reorder save before queue loop
  - `retry()` — lines 1318-1346: add save before `addBulk`
  - `_handleDocumentParsedLocked()` + `queueSingleExtraction()` — lines 543-635 + 752-836: save before queuing extraction

---

## Task 1: Fix `create()` — save parsing status before queuing parse jobs

**Files:**
- Modify: `server/src/runs/runs.service.ts:307-345`

The current code at `create()` (lines 307-345):
```typescript
await this.runRepo.save(run); // sources all 'pending'

for (const source of run.sources) {
  source.status = 'parsing'; // in-memory
  // addLog...
  await this.queueService.addJob(...); // RACE: job live, DB still 'pending'
}

run.status = RunStatus.PARSING;
run.progress!.currentStep = 'parsing';
const savedRun = await this.runRepo.save(run); // too late
```

- [ ] **Step 1: Apply the fix to `create()`**

Replace lines 307-345 in `server/src/runs/runs.service.ts`:

```typescript
    await this.runRepo.save(run);

    this.addLog(run, 'info', `Run started with ${sources.length} document(s)`);

    // Mark all sources as 'parsing' and persist BEFORE queuing any jobs.
    // Without this, a fast worker can complete and push a parsed event while
    // the DB still shows 'pending', causing the handler to drop the event.
    for (const source of run.sources) {
      source.status = 'parsing';
    }
    run.status = RunStatus.PARSING;
    run.progress!.currentStep = 'parsing';
    await this.runRepo.save(run);

    // Now safe to queue — any completion event will find 'parsing' in DB
    for (const source of run.sources) {
      this.addLog(run, 'info', `Queuing document '${source.name}' for parsing`);
      try {
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
            parser_engine: extractor.parserEngine,
          },
        );
        this.logger.log(`Parse Requested for document ${source.name}`);
      } catch (err) {
        source.status = 'failed';
        source.error = `enqueue failed: ${(err as Error).message}`;
        this.addLog(
          run,
          'error',
          `Failed to queue '${source.name}': ${(err as Error).message}`,
        );
      }
    }

    this.addLog(run, 'info', 'All documents queued, parsing started');

    const savedRun = await this.runRepo.save(run);
    await this.flushLogs(run.id);
```

- [ ] **Step 2: Verify the server compiles**

```bash
cd server && pnpm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/runs/runs.service.ts
git commit -m "fix(runs): persist parsing status before queuing parse jobs in create()"
```

---

## Task 2: Fix `retry()` — save parsing status before `addBulk`

**Files:**
- Modify: `server/src/runs/runs.service.ts:1318-1346`

Current `retry()` (lines 1318-1346):
```typescript
await this.runRepo.save(run); // sources all 'pending'

const parseJobs = run.sources.map((source) => {
  source.status = 'parsing'; // in-memory
  source.retryGeneration++;
  // ...
  return { name: 'parse-document', data: { ... } };
});

await this.queueService.addBulk(...); // RACE: jobs live, DB has 'pending'

run.status = RunStatus.PARSING;
run.progress.currentStep = 'parsing';
const savedRun = await this.runRepo.save(run); // too late
```

- [ ] **Step 1: Apply the fix to `retry()`**

Replace lines 1318-1346 in `server/src/runs/runs.service.ts`:

```typescript
    await this.runRepo.save(run);
    await this.flushLogs(run.id);

    // Re-queue documents: increment retryGeneration per source so stale results
    // from the previous attempt are rejected by handleDocumentParsed
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

    // Persist 'parsing' status BEFORE bulk-queuing so any fast completion
    // event finds the correct DB state.
    run.status = RunStatus.PARSING;
    run.progress.currentStep = 'parsing';
    await this.runRepo.save(run);

    await this.queueService.addBulk(QueueName.UPLOADED_DOCUMENTS, parseJobs);

    const savedRun = await this.runRepo.save(run);
    await this.flushLogs(run.id);
```

- [ ] **Step 2: Verify the server compiles**

```bash
cd server && pnpm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/runs/runs.service.ts
git commit -m "fix(runs): persist parsing status before addBulk in retry()"
```

---

## Task 3: Fix PER_DOCUMENT extraction — save before queuing extraction job

**Files:**
- Modify: `server/src/runs/runs.service.ts:543-635` (`_handleDocumentParsedLocked`)
- Modify: `server/src/runs/runs.service.ts:752-837` (`queueSingleExtraction`)

In PER_DOCUMENT mode, `queueSingleExtraction` is called (line 564) after the parse save (line 518) but before the final run save (line 635). Inside `queueSingleExtraction`, `source.extractionStatus = 'extracting'` is set at line 757, then the job is queued at line 819. DB is not updated until line 635 — the same race window.

The extraction handler (`_handleExtractionCompletedInner`) has no explicit "ignore if null extractionStatus" guard, so this doesn't cause a permanent stuck state today, but it creates undefined behaviour if an extraction completes in the window. Fix it for correctness.

- [ ] **Step 1: Add a DB save before `addJob` inside `queueSingleExtraction` (non-FREELLM path)**

In `queueSingleExtraction` (around line 818), insert a save before `addJob`:

Locate this block inside `queueSingleExtraction`:
```typescript
      try {
        await this.queueService.addJob(
          QueueName.EXTRACTION_REQUESTS,
          'extract-data',
          extractionPayload,
        );
        this.addLog(run, 'info', `Extraction job queued for '${source.name}'`);
```

Replace with:
```typescript
      try {
        // Persist extractionStatus = 'extracting' before the job enters the queue
        // so the completion handler always sees the correct DB state.
        await this.runRepo.save(run);
        await this.queueService.addJob(
          QueueName.EXTRACTION_REQUESTS,
          'extract-data',
          extractionPayload,
        );
        this.addLog(run, 'info', `Extraction job queued for '${source.name}'`);
```

- [ ] **Step 2: Verify the server compiles**

```bash
cd server && pnpm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/runs/runs.service.ts
git commit -m "fix(runs): persist extractionStatus before queuing extraction job in PER_DOCUMENT mode"
```

---

## Task 4: Manual smoke test

- [ ] **Step 1: Start the full stack**

```bash
docker-compose up -d
```

- [ ] **Step 2: Create a run with 5+ files**

Upload 5+ PDFs in one run and start it.

- [ ] **Step 3: Verify no source gets stuck**

Watch the run sources panel. Every source should progress through parsing → extraction → done. No source should stay in "parsing" or "extracting" indefinitely.

- [ ] **Step 4: Retry a stuck run from before the fix (regression check)**

If you have a previously stuck run, retry it and verify it now completes cleanly.

- [ ] **Step 5: Commit smoke test results**

No code change — just noting verification passed.

---

## Self-Review

**Spec coverage:**
- ✅ `create()` race condition fixed (Task 1)
- ✅ `retry()` race condition fixed (Task 2)
- ✅ Extraction queue race condition fixed (Task 3)
- ✅ `retrySource()` already correct (saves before queuing at line 1433 — no fix needed)

**Placeholder scan:** None.

**Type consistency:** All references to `RunStatus.PARSING`, `QueueName.UPLOADED_DOCUMENTS`, `source.status`, `run.progress` match existing types in the file.
