# Few-Shot Examples — Complete Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to add input→output examples to extractors; example sources (file/URL) are parsed in the background via BullMQ, and their parsed markdown is injected into every LLM extraction call.

**Architecture:** When an extractor is saved with file/URL example sources, NestJS dispatches a BullMQ parse job per unparsed source. The parser-service picks up jobs (file→boto3 from MinIO, URL→engine.parse_url), pushes results to a completion queue, and a NestJS consumer updates `parsedContent` in the extractor JSONB. At extraction time, both the NestJS LlmService and the Python extraction-service build a few-shot prompt block from `parsedContent` values and prepend it to the extraction prompt.

**Tech Stack:** NestJS + BullMQ (@nestjs/bullmq), Python FastAPI + bullmq Python package, TypeORM (JSONB), React 19 + react-hook-form.

---

## Approach Summary

| Decision | Chosen |
|---|---|
| When to parse? | Background BullMQ job dispatched on extractor save |
| How user triggers? | Auto-triggered on save — no button needed |
| File source fetch? | Parser-service downloads from MinIO via boto3 using `storageKey` |
| URL source fetch? | Parser-service calls `engine.parse_url(url)` directly |
| Few-shot injection? | Inline text block prepended to extraction prompt (compatible with `response_format: json_object`) |
| Frontend status? | ⏳ / ✓ badge based on `parsedContent` presence; TanStack Query refetch after save shows updated state |

---

## File Map

| File | Action | What changes |
|---|---|---|
| `server/src/extractors/entities/extractor.entity.ts` | Modify | Add `parsedContent?: string`, `storageKey?: string` to `FewShotExampleSource` |
| `server/src/shared/queue/queue-names.ts` | Modify | Add 2 new queue name enum values |
| `server/src/shared/queue/queue.module.ts` | Modify | Register 2 new queues with `BullModule.registerQueue` |
| `server/src/shared/queue/queue.service.ts` | Modify | Inject + expose 2 new queues via `getQueue()` |
| `server/src/extractors/extractors.service.ts` | Modify | Inject `QueueService`; dispatch parse jobs in `create()`/`update()` |
| `server/src/extractors/extractors.module.ts` | Modify | Add `QueueModule` import, register new consumer |
| `server/src/extractors/example-source-consumer.ts` | **Create** | `@Processor` for `example-source-parse-completed`; updates `parsedContent` in extractor JSONB |
| `workers/parser-service/src/consumer.py` | Modify | Add second BullMQ Worker for `example-source-parse-requests` |
| `workers/extraction-service/src/extractor.py` | Modify | `run_llm_extraction()` accepts `examples`, builds few-shot block |
| `server/src/shared/llm/llm.service.ts` | Modify | `extract()` accepts optional `fewShotExamples`, builds few-shot block |
| `server/src/runs/runs.service.ts` | Modify | Pass `extractor?.fewShotExamples` to all 4 `llmService.extract()` calls |
| `client/src/components/extractors/FewShotExamples.tsx` | Modify | Store `storageKey` on file sources; show ⏳/✓ badges |

---

## Task 1: Extend `FewShotExampleSource` entity

**Files:**
- Modify: `server/src/extractors/entities/extractor.entity.ts`

> JSONB storage — no migration needed. Both fields are optional/additive.

- [ ] **Step 1: Add two new optional fields to the interface**

```typescript
// server/src/extractors/entities/extractor.entity.ts
export interface FewShotExampleSource {
  id: string;
  type: 'file' | 'url' | 'text';
  name: string;
  description: string;
  content: string;         // original: MinIO public URL for file, URL string for url, raw text for text
  storageKey?: string;     // MinIO storage key for file type (e.g. "user-id/timestamp_file.pdf")
  parsedContent?: string;  // parsed markdown; populated async by background job for file/url types
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/extractors/entities/extractor.entity.ts
git commit -m "feat: add storageKey and parsedContent to FewShotExampleSource"
```

---

## Task 2: Add two new BullMQ queues

**Files:**
- Modify: `server/src/shared/queue/queue-names.ts`
- Modify: `server/src/shared/queue/queue.module.ts`
- Modify: `server/src/shared/queue/queue.service.ts`

- [ ] **Step 1: Add enum values to `queue-names.ts`**

```typescript
// server/src/shared/queue/queue-names.ts
export enum QueueName {
  UPLOADED_DOCUMENTS = 'uploaded-documents',
  PARSED_DOCUMENTS = 'parsed-documents',
  EXTRACTION_REQUESTS = 'extraction-requests',
  EXTRACTION_COMPLETED = 'extraction-completed',
  WORKFLOW_EXECUTIONS = 'workflow-executions',
  EXAMPLE_SOURCE_PARSE_REQUESTS = 'example-source-parse-requests',   // ADD
  EXAMPLE_SOURCE_PARSE_COMPLETED = 'example-source-parse-completed', // ADD
}
```

- [ ] **Step 2: Register new queues in `queue.module.ts`**

```typescript
// server/src/shared/queue/queue.module.ts
BullModule.registerQueue(
  { name: QueueName.UPLOADED_DOCUMENTS },
  { name: QueueName.PARSED_DOCUMENTS },
  { name: QueueName.EXTRACTION_REQUESTS },
  { name: QueueName.EXTRACTION_COMPLETED },
  { name: QueueName.WORKFLOW_EXECUTIONS },
  { name: QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS },   // ADD
  { name: QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED },  // ADD
),
```

- [ ] **Step 3: Inject new queues in `queue.service.ts`**

Add to constructor:
```typescript
@InjectQueue(QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS)
private readonly exampleSourceParseRequestsQueue: Queue,
@InjectQueue(QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED)
private readonly exampleSourceParseCompletedQueue: Queue,
```

Add cases to `getQueue()` switch:
```typescript
case QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS:
  return this.exampleSourceParseRequestsQueue;
case QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED:
  return this.exampleSourceParseCompletedQueue;
```

- [ ] **Step 4: Commit**

```bash
git add server/src/shared/queue/
git commit -m "feat: add example-source-parse-requests and example-source-parse-completed queues"
```

---

## Task 3: Parser-service — handle example source parse jobs

**Files:**
- Modify: `workers/parser-service/src/consumer.py`

**Context:** The existing `consumer.py` has one `Worker` for `uploaded-documents`. We add a second `Worker` for `example-source-parse-requests`. The `s3_client` and `get_engine()` are already available. The job payload contains `{ extractor_id, example_id, source_id, type, storage_key?, url?, bucket }`.

- [ ] **Step 1: Add `process_example_source_job` function**

Add after `_idle_watcher()` and before `consume()`:

```python
QUEUE_EXAMPLE_PARSE_REQUESTS = "example-source-parse-requests"
QUEUE_EXAMPLE_PARSE_COMPLETED = "example-source-parse-completed"

async def process_example_source_job(job: Job, token: str = None):
    """
    Parse an example source (file from MinIO or URL) and push result
    to the example-source-parse-completed queue.
    """
    global _last_activity
    _last_activity = time.monotonic()

    data = job.data
    extractor_id = data.get("extractor_id")
    example_id = data.get("example_id")
    source_id = data.get("source_id")
    source_type = data.get("type")
    bucket = data.get("bucket", MINIO_BUCKET)

    logger.info(
        f"📥 Example source parse job {job.id}: extractor={extractor_id} "
        f"example={example_id} source={source_id} type={source_type}"
    )

    try:
        engine_name = data.get("parser_engine")
        engine = get_engine(engine_name)

        if source_type == "url":
            url = data.get("url")
            if not url:
                raise ValueError("No url in job data for url-type source")
            result = await asyncio.to_thread(engine.parse_url, url)

        elif source_type == "file":
            storage_key = data.get("storage_key")
            if not storage_key:
                raise ValueError("No storage_key in job data for file-type source")
            file_stream = io.BytesIO()
            s3_client.download_fileobj(bucket, storage_key, file_stream)
            file_stream.seek(0)
            file_bytes = file_stream.read()
            file_stream.close()
            del file_stream
            result = await asyncio.to_thread(engine.parse_bytes, file_bytes, storage_key)
            del file_bytes

        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        event = {
            "extractor_id": extractor_id,
            "example_id": example_id,
            "source_id": source_id,
            "status": "success",
            "parsed_content": result.markdown_content,
        }
        del result

    except Exception as e:
        logger.error(f"❌ Example source parse failed: {e}", exc_info=True)
        event = {
            "extractor_id": extractor_id,
            "example_id": example_id,
            "source_id": source_id,
            "status": "failed",
            "error": str(e),
        }

    await bullmq_client.add_job(
        QUEUE_EXAMPLE_PARSE_COMPLETED, "example-source-parsed", event
    )
    gc.collect()
    return {"status": event["status"]}
```

- [ ] **Step 2: Create second Worker in `consume()`**

```python
async def consume():
    """
    Main entry point for starting the workers.
    """
    logger.info(f"Starting BullMQ worker for queue {QUEUE_UPLOADED} (concurrency={PARSER_CONCURRENCY})")
    worker = bullmq_client.create_worker(QUEUE_UPLOADED, process_job, concurrency=PARSER_CONCURRENCY)

    logger.info(f"Starting BullMQ worker for queue {QUEUE_EXAMPLE_PARSE_REQUESTS}")
    example_worker = bullmq_client.create_worker(
        QUEUE_EXAMPLE_PARSE_REQUESTS, process_example_source_job, concurrency=2
    )

    idle_task = asyncio.create_task(_idle_watcher())
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Workers cancelled")
    finally:
        idle_task.cancel()
        await worker.close()
        await example_worker.close()
```

- [ ] **Step 3: Commit**

```bash
cd workers/parser-service
git add src/consumer.py
git commit -m "feat: add BullMQ worker for example-source-parse-requests in parser-service"
```

---

## Task 4: ExtractorsService — dispatch parse jobs on save

**Files:**
- Modify: `server/src/extractors/extractors.service.ts`
- Modify: `server/src/extractors/extractors.module.ts`

**Context:** `QueueModule` is `@Global()` so `QueueService` is injectable without adding to imports. `ExtractorsModule` needs `QueueModule` added to its imports for BullMQ processor registration in the next task (but `QueueService` injection works already via global).

- [ ] **Step 1: Inject `QueueService` into `ExtractorsService`**

Add import:
```typescript
import { QueueService } from '../shared/queue/queue.service';
import { QueueName } from '../shared/queue/queue-names';
```

Add to constructor:
```typescript
constructor(
  @InjectRepository(Extractor)
  private readonly extractorRepository: Repository<Extractor>,
  private readonly llmService: LlmService,
  private readonly queueService: QueueService,  // ADD
) {}
```

- [ ] **Step 2: Add `dispatchExampleSourceParseJobs()` private method**

```typescript
private async dispatchExampleSourceParseJobs(
  extractorId: string,
  fewShotExamples: any[],
  parserEngine: string,
): Promise<void> {
  const jobs: Array<{ name: string; data: any }> = [];

  for (const example of fewShotExamples ?? []) {
    for (const source of example.sources ?? []) {
      // Skip text sources (content IS the markdown) and already-parsed sources
      if (source.type === 'text' || source.parsedContent) continue;

      const jobData: Record<string, any> = {
        extractor_id: extractorId,
        example_id: example.id,
        source_id: source.id,
        type: source.type,
        parser_engine: parserEngine,
        bucket: 'docxtractor-documents',
      };

      if (source.type === 'file') {
        if (!source.storageKey) {
          this.logger.warn(
            `Skipping file source ${source.id} — no storageKey present`,
          );
          continue;
        }
        jobData.storage_key = source.storageKey;
      } else if (source.type === 'url') {
        if (!source.content) {
          this.logger.warn(`Skipping url source ${source.id} — no content`);
          continue;
        }
        jobData.url = source.content;
      }

      jobs.push({ name: 'parse-example-source', data: jobData });
    }
  }

  if (jobs.length > 0) {
    this.logger.log(
      `Dispatching ${jobs.length} example source parse job(s) for extractor ${extractorId}`,
    );
    await this.queueService.addBulk(
      QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS,
      jobs,
    );
  }
}
```

- [ ] **Step 3: Call `dispatchExampleSourceParseJobs` at end of `create()` and `update()`**

In `create()`, after saving:
```typescript
// After: const extractor = await this.extractorRepository.save(newExtractor);
await this.dispatchExampleSourceParseJobs(
  extractor.id,
  extractor.fewShotExamples,
  extractor.parserEngine,
);
return extractor;
```

In `update()`, after saving:
```typescript
// After: const updated = await this.extractorRepository.save(extractor);
await this.dispatchExampleSourceParseJobs(
  updated.id,
  updated.fewShotExamples,
  updated.parserEngine,
);
return updated;
```

- [ ] **Step 4: Add `QueueModule` to `ExtractorsModule` imports (needed for consumer in Task 5)**

```typescript
// server/src/extractors/extractors.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from '../shared/queue/queue.module';
import { ExtractorsService } from './extractors.service';
import { ExtractorsController } from './extractors.controller';
import { Extractor } from './entities/extractor.entity';
import { ExampleSourceParsedConsumer } from './example-source-consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Extractor]), QueueModule],
  controllers: [ExtractorsController],
  providers: [ExtractorsService, ExampleSourceParsedConsumer],
})
export class ExtractorsModule {}
```

> Note: `ExampleSourceParsedConsumer` is created in Task 5 — add import after that file exists.

- [ ] **Step 5: Commit**

```bash
git add server/src/extractors/extractors.service.ts server/src/extractors/extractors.module.ts
git commit -m "feat: dispatch example source parse jobs when extractor is saved"
```

---

## Task 5: NestJS consumer — update `parsedContent` when parsing completes

**Files:**
- Create: `server/src/extractors/example-source-consumer.ts`

- [ ] **Step 1: Create the consumer file**

```typescript
// server/src/extractors/example-source-consumer.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueName } from '../shared/queue/queue-names';
import { Extractor } from './entities/extractor.entity';

@Processor(QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED)
export class ExampleSourceParsedConsumer extends WorkerHost {
  private readonly logger = new Logger(ExampleSourceParsedConsumer.name);

  constructor(
    @InjectRepository(Extractor)
    private readonly extractorRepository: Repository<Extractor>,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const {
      extractor_id,
      example_id,
      source_id,
      status,
      parsed_content,
      error,
    } = job.data;

    if (status !== 'success') {
      this.logger.warn(
        `Example source parse failed for extractor=${extractor_id} source=${source_id}: ${error}`,
      );
      return;
    }

    const extractor = await this.extractorRepository.findOne({
      where: { id: extractor_id },
    });

    if (!extractor) {
      this.logger.warn(`Extractor ${extractor_id} not found — skipping update`);
      return;
    }

    let updated = false;
    for (const example of extractor.fewShotExamples ?? []) {
      if (example.id !== example_id) continue;
      for (const source of example.sources ?? []) {
        if (source.id !== source_id) continue;
        source.parsedContent = parsed_content;
        updated = true;
        break;
      }
      if (updated) break;
    }

    if (!updated) {
      this.logger.warn(
        `Source ${source_id} not found in extractor ${extractor_id} — may have been deleted`,
      );
      return;
    }

    // TypeORM won't detect nested JSONB mutation — mark column as dirty explicitly
    await this.extractorRepository
      .createQueryBuilder()
      .update(Extractor)
      .set({ fewShotExamples: extractor.fewShotExamples })
      .where('id = :id', { id: extractor_id })
      .execute();

    this.logger.log(
      `✅ parsedContent updated for source ${source_id} in extractor ${extractor_id}`,
    );
  }
}
```

> **Why `createQueryBuilder().update()` instead of `save()`?** TypeORM's `save()` doesn't detect mutations inside JSONB arrays — the column appears unchanged. Using a direct UPDATE with the full JSONB value guarantees the write.

- [ ] **Step 2: Commit**

```bash
git add server/src/extractors/example-source-consumer.ts
git commit -m "feat: consume example-source-parse-completed and update parsedContent in extractor"
```

---

## Task 6: Python extraction — inject examples into LLM prompt

**Files:**
- Modify: `workers/extraction-service/src/extractor.py`

**Context:** `run_extraction()` already passes `examples` to `run_langextract_extraction()` but not to `run_llm_extraction()`. Fix both. For each source, use `parsedContent` if set, else fall back to `content` only if `type == "text"` (file/url without `parsedContent` = not yet parsed → skip).

- [ ] **Step 1: Add `_build_few_shot_block()` helper**

Add after the `_llm_client` initialization (~line 26):

```python
def _build_few_shot_block(examples: list) -> str:
    """
    Build a few-shot text block from fewShotExamples list.
    Uses parsedContent for file/url sources, content for text sources.
    Skips sources with no usable text.
    """
    if not examples:
        return ""

    blocks = []
    for i, ex in enumerate(examples, 1):
        source_parts = []
        for src in ex.get("sources", []):
            src_type = src.get("type", "text")
            if src_type == "text":
                text = src.get("content", "").strip()
            else:
                # file or url — only use if already parsed
                text = (src.get("parsedContent") or "").strip()
            if text:
                source_parts.append(text)

        output = (ex.get("output") or "").strip()
        if not source_parts and not output:
            continue

        combined = "\n\n---\n\n".join(source_parts) if source_parts else "(no input)"
        blocks.append(f"Example {i}:\nInput:\n{combined}\nExpected Output:\n{output}")

    if not blocks:
        return ""

    return (
        "\n\nHere are examples of the expected extraction format:\n\n"
        + "\n\n---\n\n".join(blocks)
        + "\n\n"
    )
```

- [ ] **Step 2: Update `run_llm_extraction()` signature and prompt**

```python
def run_llm_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = None,
    examples: list = None,   # ADD
) -> dict:
    try:
        resolved_model = model_id or LLM_DEFAULT_MODEL

        fields_desc = "\n".join([
            f"- {f['name']} ({f['type']}): {f.get('description', '')}"
            for f in schema_config.get('fields', [])
        ])

        if system_prompt:
            prompt_instruction = (
                f"{system_prompt}\n\nFields to extract:\n{fields_desc}\n\n"
                "Return a valid JSON object matching this structure."
            )
        else:
            prompt_instruction = textwrap.dedent(f"""\
                Extract the following fields from the document text.
                Reference the exact text where possible.

                Fields to extract:
                {fields_desc}

                Return a valid JSON object matching this structure.
            """)

        few_shot_block = _build_few_shot_block(examples)
        full_prompt = f"{prompt_instruction}{few_shot_block}\nDocument Content:\n{content}"

        response = _llm_client.chat.completions.create(
            model=resolved_model,
            messages=[{"role": "user", "content": full_prompt}],
            response_format={"type": "json_object"},
        )

        result_data = json.loads(response.choices[0].message.content)
        return {
            "data": result_data,
            "usage": {
                "total_tokens": response.usage.total_tokens if response.usage else 0
            }
        }

    except Exception as e:
        logger.error(f"LLM Extraction failed: {e}")
        raise e
```

- [ ] **Step 3: Update `run_extraction()` dispatcher — pass `examples` to LLM path**

```python
def run_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = None,
    extraction_type: str = "llm",
    examples: list = None
) -> dict:
    resolved_model = model_id or LLM_DEFAULT_MODEL
    logger.info(f"Running extraction (type: {extraction_type}) with model {resolved_model}...")

    if extraction_type == "langextract":
        return run_langextract_extraction(content, schema_config, resolved_model, examples)
    else:
        return run_llm_extraction(content, schema_config, system_prompt, resolved_model, examples)
        #                                                                               ^^^^^^^^ now passed
```

- [ ] **Step 4: Commit**

```bash
cd workers/extraction-service
git add src/extractor.py
git commit -m "feat: inject few-shot examples into Python LLM extraction prompt"
```

---

## Task 7: NestJS LlmService — inject examples into extraction prompt

**Files:**
- Modify: `server/src/shared/llm/llm.service.ts`

- [ ] **Step 1: Add `FewShotExample` interface and `buildFewShotBlock()` helper**

Add before the `@Injectable()` decorator:

```typescript
interface FewShotSource {
  type?: string;
  parsedContent?: string;
  content?: string;
}
interface FewShotExample {
  sources: FewShotSource[];
  output: string;
}

function buildFewShotBlock(examples?: FewShotExample[]): string {
  if (!examples?.length) return '';

  const blocks = examples
    .map((ex, i) => {
      const sourceTexts = ex.sources
        .map((s) => {
          if (s.type === 'text') return (s.content || '').trim();
          return (s.parsedContent || '').trim(); // file/url: only use if parsed
        })
        .filter((t) => t.length > 0);

      const combinedInput = sourceTexts.join('\n\n---\n\n') || '(no input)';
      const output = (ex.output || '').trim();
      if (!sourceTexts.length && !output) return null;

      return `Example ${i + 1}:\nInput:\n${combinedInput}\nExpected Output:\n${output}`;
    })
    .filter((b): b is string => b !== null);

  if (!blocks.length) return '';

  return (
    '\n\nHere are examples of the expected extraction format:\n\n' +
    blocks.join('\n\n---\n\n') +
    '\n\n'
  );
}
```

- [ ] **Step 2: Update `extract()` signature and prompt construction**

```typescript
async extract(
  content: string,
  schema: Record<string, any>,
  systemPrompt: string,
  model?: string,
  fewShotExamples?: FewShotExample[],  // ADD optional 5th param
): Promise<LlmExtractionResult> {
  const modelId = model || this.defaultModel;
  const fieldsDesc = this.buildFieldsDescription(schema);

  const instruction = systemPrompt
    ? `${systemPrompt}\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`
    : `Extract the following fields from the document text.\nReference the exact text where possible.\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`;

  const fewShotBlock = buildFewShotBlock(fewShotExamples);
  const fullPrompt = `${instruction}${fewShotBlock}\nDocument Content:\n${content}`;

  // ... rest of method (retry loop, response parsing) unchanged ...
```

- [ ] **Step 3: Commit**

```bash
git add server/src/shared/llm/llm.service.ts
git commit -m "feat: inject few-shot examples into NestJS LLM extraction prompt"
```

---

## Task 8: RunsService — pass examples to all `llmService.extract()` calls

**Files:**
- Modify: `server/src/runs/runs.service.ts`

There are exactly 4 call sites. All need a 5th argument `extractor?.fewShotExamples`.

- [ ] **Step 1: Find and update call site 1 (~line 592) — unified FREELLM path**

```typescript
const result = await this.llmService.extract(
  combinedMarkdown,
  this.resolveEffectiveSchema(extractor, run.variantId, run.skippedFields),
  extractor?.systemPrompt || '',
  'free',
  extractor?.fewShotExamples,  // ADD
);
```

- [ ] **Step 2: Find and update call site 2 (~line 767) — per-source concurrent batch**

```typescript
extractionResult = await this.llmService.extract(
  source.parsedContent!,
  this.resolveEffectiveSchema(extractor, run.variantId, run.skippedFields),
  extractor?.systemPrompt || '',
  'free',
  extractor?.fewShotExamples,  // ADD
);
```

- [ ] **Step 3: Find and update call site 3 (~line 1289) — per-source serial**

```typescript
const result = await this.llmService.extract(
  source.parsedContent!,
  this.resolveEffectiveSchema(extractor, run.variantId, run.skippedFields),
  extractor?.systemPrompt || '',
  'free',
  extractor?.fewShotExamples,  // ADD
);
```

- [ ] **Step 4: Find and update call site 4 (~line 1567) — retry/resume loop**

```typescript
const result = await this.llmService.extract(
  source.parsedContent!,
  effectiveSchema,
  extractor?.systemPrompt || '',
  'free',
  extractor?.fewShotExamples,  // ADD
);
```

- [ ] **Step 5: Commit**

```bash
git add server/src/runs/runs.service.ts
git commit -m "feat: pass fewShotExamples to llmService.extract at all call sites"
```

---

## Task 9: Frontend — store `storageKey`, show parse status badges

**Files:**
- Modify: `client/src/components/extractors/FewShotExamples.tsx`

**Context:** The upload `onUploadFile` callback returns `{ url, id, storageKey }` from `FilesService.uploadFile()`. Currently the component only stores `url` as `content`. We need to also store `storageKey`.

Check `handleUploadFile` in `ExtractorForm.tsx` — it calls `uploadFileMutation.mutateAsync` which returns the server response. Verify `storageKey` is in that response (it is — `FilesService.uploadFile()` returns `{ id, url, storageKey }`).

**No new props needed** — no `onParseSource` callback, no parse button. Parsing is fully background.

- [ ] **Step 1: Add `storageKey` to `Source` interface**

```typescript
// client/src/components/extractors/FewShotExamples.tsx
export interface Source {
  id: string;
  type: SourceType;
  name: string;
  description: string;
  content: string;
  storageKey?: string;    // ADD: MinIO storage key, populated after file upload
  parsedContent?: string; // ADD: parsed markdown, populated async by backend
}
```

- [ ] **Step 2: Update `onUploadFile` prop type in `FewShotExamples` and `FewShotExampleItem` to include `storageKey` in return**

```typescript
interface FewShotExamplesProps {
  onUploadFile?: (file: File) => Promise<{ url: string; id: string; storageKey?: string }>;
}

interface FewShotExampleItemProps {
  example: any;
  index: number;
  onRemove: () => void;
  onUploadFile?: (file: File) => Promise<{ url: string; id: string; storageKey?: string }>;
}
```

- [ ] **Step 3: Update `addFileSource` to store `storageKey`**

```typescript
const addFileSource = async (file: File) => {
  const id = crypto.randomUUID();
  const newSource: Source = {
    id,
    type: "file" as const,
    name: file.name,
    description: "Uploading...",
    content: "",
  };

  appendSource(newSource);

  try {
    if (onUploadFile) {
      const result = await onUploadFile(file);
      const currentSources = getValues(`fewShotExamples.${index}.sources` as any);
      const sourceIndex = currentSources.findIndex((s: any) => s.id === id);
      if (sourceIndex !== -1) {
        updateSource(sourceIndex, {
          ...newSource,
          content: result.url,
          storageKey: result.storageKey,   // ADD
          description: `${(file.size / 1024).toFixed(1)} KB`,
        });
      }
    }
  } catch (error) {
    console.error("File upload error:", error);
    const currentSources = getValues(`fewShotExamples.${index}.sources` as any);
    const sourceIndex = currentSources.findIndex((s: any) => s.id === id);
    if (sourceIndex !== -1) {
      updateSource(sourceIndex, { ...newSource, description: "Upload failed" });
    }
  }
};
```

- [ ] **Step 4: Add parse status badge to source header display**

In the source item JSX, inside the source header `<div>` (after the source name/description span), add a status badge:

```tsx
{/* Parse status badge — shown for file and url sources */}
{(source.type === "file" || source.type === "url") && (
  <span
    className={cn(
      "text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ml-1 shrink-0",
      source.parsedContent
        ? "bg-green-50 text-green-700 border-green-300"
        : "bg-yellow-50 text-yellow-700 border-yellow-300"
    )}
  >
    {source.parsedContent ? "✓ PARSED" : "⏳ QUEUED"}
  </span>
)}
```

- [ ] **Step 5: Update `ExtractorForm.tsx` — include `storageKey` in upload result**

Check the current `handleUploadFile` in `ExtractorForm.tsx`. It calls `uploadFileMutation.mutateAsync` and extracts from `(result as any).data`. Add `storageKey` to what it returns:

```typescript
const handleUploadFile = async (file: File) => {
  if (!user?.id) throw new Error("User not authenticated");

  const result = await uploadFileMutation.mutateAsync({
    data: { file, userId: user.id },
  });

  const successData = (result as any).data;
  if (!successData?.url) {
    throw new Error("Upload failed: no URL returned");
  }

  // Keep existing behavior + pass through storageKey
  return {
    url: successData.url as string,
    id: successData.id as string,
    storageKey: successData.storageKey as string | undefined,
  };
};
```

- [ ] **Step 6: Run Biome**

```bash
cd client
pnpm run check
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/extractors/FewShotExamples.tsx client/src/components/extractors/ExtractorForm.tsx
git commit -m "feat: store storageKey on file sources and show parse status badges"
```

---

## Task 10: End-to-end smoke test

- [ ] **Step 1: Rebuild and start all services**

```bash
docker-compose up -d --build
```

- [ ] **Step 2: Add a URL example source**

1. Open `http://localhost:5174`, log in
2. Create or edit an extractor
3. Go to Advanced Options → Few-Shot Examples → Create First Example
4. Click `+ URL`, type `https://example.com`
5. Fill in Expected JSON Output: `{"title": "Example Domain"}`
6. Click Save extractor
7. Source badge should show **⏳ QUEUED**

- [ ] **Step 3: Verify parser-service picks up the job**

```bash
docker-compose logs -f parser-service | grep "example source parse"
# Expected:
# 📥 Example source parse job ... type=url
# 📤 Sending ... to example-source-parse-completed
```

- [ ] **Step 4: Verify NestJS consumer updates DB**

```bash
docker-compose logs -f server | grep "parsedContent updated"
# Expected:
# ✅ parsedContent updated for source ... in extractor ...
```

- [ ] **Step 5: Reload extractor in browser**

Refresh the extractor editor page. The URL source badge should now show **✓ PARSED**.

- [ ] **Step 6: Run extraction and verify examples appear in prompt**

1. Start a run using this extractor
2. Check extraction-service logs:

```bash
docker-compose logs extraction-service | grep -A 10 "few-shot\|Example 1"
# Expected: "Example 1:\nInput:\n# Example Domain..." in prompt
```

- [ ] **Step 7: Add file example source**

Upload a PDF as an example source → save → verify ⏳ then ✓ after a few seconds → restart and confirm extraction includes the file content.

---

## Summary

| Task | Layer | Complexity | Independent? |
|---|---|---|---|
| 1. Entity fields | Backend | Trivial | ✅ |
| 2. Queue infrastructure | Backend | Low | ✅ |
| 3. Parser-service consumer | Python | Low | After Task 2 |
| 4. ExtractorsService dispatch jobs | Backend | Medium | After Tasks 1+2 |
| 5. NestJS ExampleSourceParsedConsumer | Backend | Low | After Tasks 1+2 |
| 6. Python extraction uses examples | Python | Low | After Task 1 |
| 7. NestJS LlmService uses examples | Backend | Low | After Task 1 |
| 8. RunsService passes examples | Backend | Trivial | After Task 7 |
| 9. Frontend storageKey + badges | Frontend | Low | After Task 1 |
| 10. E2E smoke test | Manual | — | After all tasks |

**Critical path:** Tasks 1 → 2 → {3, 4, 5 in parallel} → 6/7/8 → 9 → 10

Tasks 6+7+8 (LLM injection) are independently deployable and produce value even before parsing completes — existing text sources in examples will work immediately.
