# FreeLLM Generic LLM Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Ollama coupling in DocXtractor with FreeLLM — an OpenAI-compatible LLM gateway — so any cloud provider model can be used without infrastructure changes.

**Architecture:** A new `LlmModule` wraps the `openai` npm package pointed at `http://freellm:3000/v1`. The Python extraction-service uses the `openai` Python package to call the same endpoint. Both Docker Compose files replace `ollama1`/`ollama2` (and prod's 5 nodes) with a single `freellm` service.

**Tech Stack:** `openai` npm package (NestJS), `openai` Python package (extraction-service), `ghcr.io/devansh-365/freellm:latest` (Docker), PostgreSQL enum SQL migration.

**Spec:** `docs/superpowers/specs/2026-04-13-freellm-generic-llm-provider-design.md`

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `server/src/shared/llm/llm.service.ts` | LLM client wrapping OpenAI SDK |
| Create | `server/src/shared/llm/llm.module.ts` | Global NestJS module exporting LlmService |
| Create | `server/src/shared/llm/llm.service.spec.ts` | Unit tests for LlmService |
| Delete | `server/src/shared/ollama/ollama.service.ts` | Replaced by llm.service.ts |
| Delete | `server/src/shared/ollama/ollama.module.ts` | Replaced by llm.module.ts |
| Modify | `server/src/app.module.ts` | Swap OllamaModule → LlmModule |
| Modify | `server/src/runs/entities/run.entity.ts` | OLLAMA → FREELLM in ExtractionProvider enum |
| Modify | `server/src/runs/runs.service.ts` | OllamaService → LlmService, enum refs, method rename |
| Modify | `server/src/extractors/extractors.service.ts` | OllamaService → LlmService |
| Modify | `server/env.example` | Replace OLLAMA_* with FREELLM_* vars |
| Modify | `docker-compose.yml` | Remove ollama1/2, add freellm service |
| Modify | `docker-compose.prod.yml` | Remove ollama1-5, add freellm service |
| Modify | `workers/extraction-service/requirements.txt` | Remove google-generativeai, add openai |
| Modify | `workers/extraction-service/src/extractor.py` | Replace genai with openai client |

---

## Task 1: Install npm dependencies

**Files:**
- Modify: `server/package.json` (via pnpm)

- [ ] **Step 1: Add openai package, remove ollama**

```bash
cd server && pnpm add openai && pnpm remove ollama
```

Expected: `openai` appears in `package.json` dependencies, `ollama` is removed.

- [ ] **Step 2: Verify**

```bash
grep -E '"openai"|"ollama"' package.json
```

Expected output contains `"openai"`, does NOT contain `"ollama"`.

- [ ] **Step 3: Commit**

```bash
cd ..
git add server/package.json server/pnpm-lock.yaml
git commit -m "chore(server): replace ollama npm package with openai"
```

---

## Task 2: Create LlmService (TDD)

**Files:**
- Create: `server/src/shared/llm/llm.service.spec.ts`
- Create: `server/src/shared/llm/llm.service.ts`
- Create: `server/src/shared/llm/llm.module.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p server/src/shared/llm
```

- [ ] **Step 2: Write the failing test file**

Create `server/src/shared/llm/llm.service.spec.ts`:

```typescript
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate,
  };
});

import OpenAI from 'openai';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';

function getMockCreate(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('openai') as any).__mockCreate as jest.Mock;
}

const mockConfigGet = jest.fn((key: string, def?: any) => {
  if (key === 'FREELLM_BASE_URL') return 'http://freellm:3000/v1';
  if (key === 'LLM_DEFAULT_MODEL') return 'free-smart';
  if (key === 'LLM_MAX_RETRIES') return 3;
  return def;
});

async function buildService(): Promise<LlmService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      LlmService,
      { provide: ConfigService, useValue: { get: mockConfigGet } },
    ],
  }).compile();
  return module.get<LlmService>(LlmService);
}

describe('LlmService', () => {
  let service: LlmService;
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await buildService();
    mockCreate = getMockCreate();
  });

  describe('generate()', () => {
    it('returns parsed JSON from chat response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"name":"test"}' } }],
        usage: { total_tokens: 42 },
      });

      const result = await service.generate('describe something');

      expect(result).toEqual({ name: 'test' });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'free-smart',
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: 'describe something' }],
        }),
      );
    });

    it('retries on transient failure then returns result', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('connection error'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"ok":true}' } }],
          usage: { total_tokens: 10 },
        });

      const result = await service.generate('test prompt');

      expect(result).toEqual({ ok: true });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('throws after all retries exhausted', async () => {
      mockCreate.mockRejectedValue(new Error('persistent error'));

      await expect(service.generate('test')).rejects.toThrow('persistent error');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('uses model override when provided', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.generate('test', 'groq/llama-3.3-70b-versatile');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'groq/llama-3.3-70b-versatile' }),
      );
    });
  });

  describe('extract()', () => {
    const schema = {
      type: 'object',
      properties: {
        invoice_number: { type: 'string', description: 'Invoice ID' },
        amount: { type: 'number', description: 'Total amount' },
      },
    };

    it('returns extracted data with token count', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"invoice_number":"INV-001","amount":100}' } }],
        usage: { total_tokens: 150 },
      });

      const result = await service.extract('invoice text', schema, 'extract invoice fields');

      expect(result.data).toEqual({ invoice_number: 'INV-001', amount: 100 });
      expect(result.usage.totalTokens).toBe(150);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ response_format: { type: 'json_object' } }),
      );
    });

    it('includes systemPrompt in the request message', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.extract('content', schema, 'Be precise and accurate');

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain('Be precise and accurate');
    });

    it('uses model override when provided', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.extract('content', schema, '', 'gemini/gemini-2.5-flash');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini/gemini-2.5-flash' }),
      );
    });

    it('handles legacy fields schema format', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"total":"100"}' } }],
        usage: { total_tokens: 20 },
      });

      const legacySchema = {
        fields: [{ name: 'total', type: 'string', description: 'Total value' }],
      };

      const result = await service.extract('text', legacySchema, '');

      expect(result.data).toEqual({ total: '100' });
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain('- total (string): Total value');
    });
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail (module not found)**

```bash
cd server && pnpm run test -- --testPathPattern=llm.service.spec
```

Expected: FAIL with `Cannot find module './llm.service'`

- [ ] **Step 4: Write LlmService implementation**

Create `server/src/shared/llm/llm.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';

export interface LlmExtractionResult {
  data: Record<string, unknown>;
  usage: {
    totalTokens: number;
  };
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: configService.get<string>(
        'FREELLM_BASE_URL',
        'http://freellm:3000/v1',
      ),
      apiKey: 'freellm',
    });
    this.defaultModel = configService.get<string>(
      'LLM_DEFAULT_MODEL',
      'free-smart',
    );
    this.maxRetries = configService.get<number>('LLM_MAX_RETRIES', 3);

    this.logger.log(
      `LlmService initialized: baseURL=${configService.get('FREELLM_BASE_URL', 'http://freellm:3000/v1')}, defaultModel=${this.defaultModel}`,
    );
  }

  async extract(
    content: string,
    schema: Record<string, any>,
    systemPrompt: string,
    model?: string,
  ): Promise<LlmExtractionResult> {
    const modelId = model || this.defaultModel;
    const fieldsDesc = this.buildFieldsDescription(schema);

    const instruction = systemPrompt
      ? `${systemPrompt}\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`
      : `Extract the following fields from the document text.\nReference the exact text where possible.\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`;

    const fullPrompt = `${instruction}\n\nDocument Content:\n${content}`;

    this.logger.log(`Running LLM extraction, model: ${modelId}`);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: fullPrompt }],
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0].message.content ?? '{}';
        this.logger.debug(`LLM response: ${raw}`);
        const resultData = JSON.parse(jsonrepair(raw)) as Record<
          string,
          unknown
        >;
        const totalTokens = response.usage?.total_tokens ?? 0;

        this.logger.log(`LLM extraction complete: tokens=${totalTokens}`);
        return { data: resultData, usage: { totalTokens } };
      } catch (error: any) {
        this.logger.error(
          `LLM extraction failed (attempt ${attempt}/${this.maxRetries}): ${error}`,
        );

        if (error?.status === 429) {
          this.logger.warn('Rate limit hit, backing off...');
          attempt--;
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 + Math.random() * 5000),
          );
          continue;
        }

        if (attempt === this.maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('LLM extraction failed after retries');
  }

  async generate(
    prompt: string,
    model?: string,
  ): Promise<Record<string, unknown>> {
    const modelId = model || this.defaultModel;
    this.logger.log(
      `Running LLM generation: model=${modelId}, prompt_length=${prompt.length}`,
    );

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0].message.content ?? '{}';
        this.logger.debug(`LLM generation response: ${raw}`);
        const result = JSON.parse(jsonrepair(raw)) as Record<string, unknown>;
        const totalTokens = response.usage?.total_tokens ?? 0;

        this.logger.log(`LLM generation complete: tokens=${totalTokens}`);
        return result;
      } catch (error: any) {
        this.logger.error(
          `LLM generation failed (attempt ${attempt}/${this.maxRetries}): ${error}`,
        );

        if (error?.status === 429) {
          this.logger.warn('Rate limit hit, backing off...');
          attempt--;
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 + Math.random() * 5000),
          );
          continue;
        }

        if (attempt === this.maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('LLM generation failed after retries');
  }

  private buildFieldsDescription(schema: Record<string, any>): string {
    // Legacy format: { fields: [{ name, type, description }] }
    if (schema.fields && Array.isArray(schema.fields)) {
      return (schema.fields as any[])
        .map((f) => `- ${f.name} (${f.type}): ${f.description || ''}`)
        .join('\n');
    }

    // JSON Schema format: { type: 'object', properties: { ... } }
    if (schema.properties && typeof schema.properties === 'object') {
      return Object.entries(schema.properties)
        .map(([name, prop]: [string, any]) => {
          const type = prop.type || 'string';
          const desc = prop.description || '';
          return `- ${name} (${type}): ${desc}`;
        })
        .join('\n');
    }

    return JSON.stringify(schema, null, 2);
  }
}
```

- [ ] **Step 5: Create LlmModule**

Create `server/src/shared/llm/llm.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { LlmService } from './llm.service';

@Global()
@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
```

- [ ] **Step 6: Run tests and verify they pass**

```bash
cd server && pnpm run test -- --testPathPattern=llm.service.spec
```

Expected: All tests PASS. If any fail, fix the implementation before continuing.

- [ ] **Step 7: Commit**

```bash
cd ..
git add server/src/shared/llm/
git commit -m "feat(server): add LlmModule with OpenAI-compatible client (FreeLLM)"
```

---

## Task 3: Update AppModule

**Files:**
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: Replace OllamaModule import with LlmModule**

In `server/src/app.module.ts`, replace:

```typescript
import { OllamaModule } from './shared/ollama/ollama.module';
```

with:

```typescript
import { LlmModule } from './shared/llm/llm.module';
```

And in the `imports` array, replace `OllamaModule` with `LlmModule`.

- [ ] **Step 2: Verify the file compiles**

```bash
cd server && pnpm run build 2>&1 | head -30
```

Expected: No TypeScript errors about missing modules.

- [ ] **Step 3: Commit**

```bash
cd ..
git add server/src/app.module.ts
git commit -m "feat(server): wire LlmModule into AppModule"
```

---

## Task 4: Rename ExtractionProvider enum

**Files:**
- Modify: `server/src/runs/entities/run.entity.ts`

- [ ] **Step 1: Update the enum definition**

In `server/src/runs/entities/run.entity.ts`, replace:

```typescript
export enum ExtractionProvider {
  DOCLO = 'doclo', // Default: internal @doclo/flows
  LANGEXTRACT = 'langextract', // Future: external Python worker
  OLLAMA = 'ollama', // Local Ollama model (runs in NestJS server)
}
```

with:

```typescript
export enum ExtractionProvider {
  DOCLO = 'doclo',
  LANGEXTRACT = 'langextract',
  FREELLM = 'freellm', // Generic LLM via FreeLLM gateway
}
```

- [ ] **Step 2: Verify build**

```bash
cd server && pnpm run build 2>&1 | grep -E "error|warning" | head -20
```

Expected: TypeScript errors for all unresolved `ExtractionProvider.OLLAMA` references. This is expected — we fix them in Task 5.

- [ ] **Step 3: Commit (partial — build broken intentionally)**

```bash
cd ..
git add server/src/runs/entities/run.entity.ts
git commit -m "feat(server): rename ExtractionProvider.OLLAMA to FREELLM"
```

---

## Task 5: Update runs.service.ts

**Files:**
- Modify: `server/src/runs/runs.service.ts`

- [ ] **Step 1: Update the OllamaService import**

In `server/src/runs/runs.service.ts`, replace:

```typescript
import { OllamaService } from '../shared/ollama/ollama.service';
```

with:

```typescript
import { LlmService } from '../shared/llm/llm.service';
```

- [ ] **Step 2: Update constructor injection**

Replace:

```typescript
    private ollamaService: OllamaService,
```

with:

```typescript
    private llmService: LlmService,
```

- [ ] **Step 3: Replace all ExtractionProvider.OLLAMA references**

Run this search-and-replace across the file (5 occurrences):

```
ExtractionProvider.OLLAMA  →  ExtractionProvider.FREELLM
```

- [ ] **Step 4: Replace all ollamaService method calls**

```
this.ollamaService.extract(  →  this.llmService.extract(
this.ollamaService.generate(  →  this.llmService.generate(
```

- [ ] **Step 5: Rename extractSingleWithOllama method**

```
extractSingleWithOllama  →  extractSingleWithLlm
```

This renames both the method definition and its call site(s).

- [ ] **Step 6: Update log messages referencing "Ollama" → "LLM"**

Find lines containing `'🦙 Running Ollama` or `'Starting extraction with ollama provider'` or similar, and update them to reference LLM:

```typescript
// Replace:
this.logger.log(`🦙 Running Ollama extraction for run ${run.id}`);
this.addLog(run, 'info', 'Starting extraction with ollama provider');
this.addLog(run, 'info', 'Running Ollama extraction...');

// With:
this.logger.log(`Running LLM extraction for run ${run.id}`);
this.addLog(run, 'info', 'Starting extraction with freellm provider');
this.addLog(run, 'info', 'Running LLM extraction...');
```

- [ ] **Step 7: Verify build passes**

```bash
cd server && pnpm run build 2>&1 | grep "error" | head -10
```

Expected: No errors.

- [ ] **Step 8: Run test suite**

```bash
pnpm run test 2>&1 | tail -20
```

Expected: All tests pass (or same failures as before this change — no new failures).

- [ ] **Step 9: Commit**

```bash
cd ..
git add server/src/runs/runs.service.ts
git commit -m "feat(server): replace OllamaService with LlmService in RunsService"
```

---

## Task 6: Update extractors.service.ts

**Files:**
- Modify: `server/src/extractors/extractors.service.ts`

- [ ] **Step 1: Update the import**

In `server/src/extractors/extractors.service.ts`, replace:

```typescript
import { OllamaService } from '../shared/ollama/ollama.service';
```

with:

```typescript
import { LlmService } from '../shared/llm/llm.service';
```

- [ ] **Step 2: Update constructor injection**

Replace:

```typescript
    private readonly ollamaService: OllamaService,
```

with:

```typescript
    private readonly llmService: LlmService,
```

- [ ] **Step 3: Replace method calls**

```
this.ollamaService.generate(  →  this.llmService.generate(
```

- [ ] **Step 4: Verify build**

```bash
cd server && pnpm run build 2>&1 | grep "error" | head -10
```

Expected: No errors.

- [ ] **Step 5: Run full test suite**

```bash
pnpm run test 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd ..
git add server/src/extractors/extractors.service.ts
git commit -m "feat(server): replace OllamaService with LlmService in ExtractorsService"
```

---

## Task 7: DB migration — rename enum value

> **IMPORTANT:** Run this SQL *before* restarting the server with the new code. If the server starts before this runs, TypeORM's sync will fail for any rows with `extractionProvider = 'ollama'`.

**Files:** None (manual SQL on the running database)

- [ ] **Step 1: Find the exact Postgres enum type name**

Connect to the database (Docker dev):

```bash
docker exec -it docxtractor-db psql -U postgres -d docxtractor \
  -c "SELECT typname FROM pg_type WHERE typtype = 'e' AND typname LIKE '%extraction%';"
```

Expected output includes a row like `runs_extractionprovider_enum`.

- [ ] **Step 2: Add 'freellm' and update existing rows**

```bash
docker exec -it docxtractor-db psql -U postgres -d docxtractor -c "
  -- Add new value to enum
  ALTER TYPE runs_extractionprovider_enum ADD VALUE IF NOT EXISTS 'freellm';

  -- Migrate existing rows
  UPDATE runs SET \"extractionProvider\" = 'freellm' WHERE \"extractionProvider\" = 'ollama';
"
```

Expected: `ALTER TYPE` and `UPDATE <N>` (N = number of affected rows, can be 0).

- [ ] **Step 3: Verify migration**

```bash
docker exec -it docxtractor-db psql -U postgres -d docxtractor \
  -c "SELECT DISTINCT \"extractionProvider\" FROM runs;"
```

Expected: No rows show `ollama`.

---

## Task 8: Delete old OllamaModule files

**Files:**
- Delete: `server/src/shared/ollama/ollama.service.ts`
- Delete: `server/src/shared/ollama/ollama.module.ts`

- [ ] **Step 1: Delete the files**

```bash
rm server/src/shared/ollama/ollama.service.ts
rm server/src/shared/ollama/ollama.module.ts
rmdir server/src/shared/ollama
```

- [ ] **Step 2: Final build check**

```bash
cd server && pnpm run build 2>&1 | grep "error" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add -A server/src/shared/ollama/
git commit -m "chore(server): delete OllamaModule (replaced by LlmModule)"
```

---

## Task 9: Update docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Remove ollama services and volumes**

Remove the entire `ollama1` and `ollama2` service blocks. Remove `ollama1_data` and `ollama2_data` from the `volumes:` section.

- [ ] **Step 2: Add freellm service**

Add after the `redis` service block:

```yaml
  freellm:
    image: ghcr.io/devansh-365/freellm:latest
    container_name: docxtractor-freellm
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY:-}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY:-}
      - CEREBRAS_API_KEY=${CEREBRAS_API_KEY:-}
      - NVIDIA_API_KEY=${NVIDIA_API_KEY:-}
    networks:
      - docxtractor-network
```

- [ ] **Step 3: Update server environment variables**

In the `server` service `environment:` block, replace:

```yaml
      - OLLAMA_HOSTS=http://ollama1:11434,http://ollama2:11434
      - OLLAMA_HOST=http://ollama1:11434
      - OLLAMA_DEFAULT_MODEL=gpt-oss:120b-cloud
      - OLLAMA_GENERATION_MODEL=gpt-oss:120b-cloud
```

with:

```yaml
      - FREELLM_BASE_URL=http://freellm:3000/v1
      - LLM_DEFAULT_MODEL=free-smart
```

- [ ] **Step 4: Update server depends_on**

In the `server` service `depends_on:` block, remove:

```yaml
      ollama1:
        condition: service_started
      ollama2:
        condition: service_started
```

Add:

```yaml
      freellm:
        condition: service_started
```

- [ ] **Step 5: Update extraction-service environment variables**

In the `extraction-service` service `environment:` block, replace:

```yaml
      - LANGEXTRACT_MODEL_URL=http://ollama1:11434
```

with:

```yaml
      - FREELLM_BASE_URL=http://freellm:3000/v1
      - LLM_DEFAULT_MODEL=free-smart
```

Also remove `extraction-service`'s `depends_on` entry for `ollama1` if present.

- [ ] **Step 6: Verify the file is valid YAML**

```bash
docker compose config > /dev/null && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(docker): replace ollama1/2 with freellm service in docker-compose.yml"
```

---

## Task 10: Update docker-compose.prod.yml

**Files:**
- Modify: `docker-compose.prod.yml`

- [ ] **Step 1: Remove all 5 ollama service blocks**

Remove `ollama1`, `ollama2`, `ollama3`, `ollama4`, `ollama5` service blocks. Remove their volumes (`ollama1_data` through `ollama5_data`) from the `volumes:` section.

- [ ] **Step 2: Add freellm service**

Add after the `redis` service block:

```yaml
  freellm:
    image: ghcr.io/devansh-365/freellm:latest
    container_name: docxtractor-freellm
    restart: unless-stopped
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
      - CEREBRAS_API_KEY=${CEREBRAS_API_KEY:-}
      - NVIDIA_API_KEY=${NVIDIA_API_KEY:-}
    networks:
      - docxtractor-network
```

- [ ] **Step 3: Update server environment variables**

In the `server` service `environment:` block, replace:

```yaml
      - OLLAMA_HOSTS=http://ollama1:11434,http://ollama2:11434,http://ollama3:11434,http://ollama4:11434,http://ollama5:11434
      - OLLAMA_HOST=http://ollama1:11434
      - OLLAMA_DEFAULT_MODEL=${OLLAMA_DEFAULT_MODEL:-gpt-oss:120b-cloud}
      - OLLAMA_GENERATION_MODEL=${OLLAMA_GENERATION_MODEL:-gpt-oss:120b-cloud}
      - OLLAMA_API_KEY=${OLLAMA_API_KEY:-base_key}
      - OLLAMA_API_KEYS=${OLLAMA_API_KEYS:-key1,key2}
      - OLLAMA_MAX_CONCURRENCY=10
```

with:

```yaml
      - FREELLM_BASE_URL=http://freellm:3000/v1
      - LLM_DEFAULT_MODEL=${LLM_DEFAULT_MODEL:-free-smart}
```

- [ ] **Step 4: Update server depends_on**

In the `server` service `depends_on:` block, remove all `ollama1` through `ollama5` entries. Add:

```yaml
      freellm:
        condition: service_started
```

- [ ] **Step 5: Update extraction-service environment variables**

Replace:

```yaml
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - LANGEXTRACT_API_KEY=${LANGEXTRACT_API_KEY}
      - LANGEXTRACT_MODEL_URL=http://ollama1:11434
```

with:

```yaml
      - FREELLM_BASE_URL=http://freellm:3000/v1
      - LLM_DEFAULT_MODEL=${LLM_DEFAULT_MODEL:-free-smart}
```

Also remove the `ollama1: condition: service_started` entry from `extraction-service`'s `depends_on:` block.

- [ ] **Step 6: Verify the file is valid YAML**

```bash
docker compose -f docker-compose.prod.yml config > /dev/null && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 7: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat(docker): replace ollama1-5 with freellm service in docker-compose.prod.yml"
```

---

## Task 11: Update server/env.example

**Files:**
- Modify: `server/env.example`

- [ ] **Step 1: Replace Ollama section**

Replace:

```
# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gpt-oss:120b-cloud
OLLAMA_GENERATION_MODEL=gpt-oss:120b-cloud
```

with:

```
# FreeLLM — add at least one provider API key
FREELLM_BASE_URL=http://freellm:3000/v1
LLM_DEFAULT_MODEL=free-smart
# GROQ_API_KEY=
# GEMINI_API_KEY=
# MISTRAL_API_KEY=
# CEREBRAS_API_KEY=
# NVIDIA_API_KEY=
```

- [ ] **Step 2: Remove extraction service API key comments**

Remove:

```
# Extraction Service APIs (set GOOGLE_API_KEY if using Gemini extraction provider)
# GOOGLE_API_KEY=
# LANGEXTRACT_API_KEY=
```

- [ ] **Step 3: Commit**

```bash
git add server/env.example
git commit -m "chore(server): update env.example for FreeLLM provider"
```

---

## Task 12: Update Python extraction-service

**Files:**
- Modify: `workers/extraction-service/requirements.txt`
- Modify: `workers/extraction-service/src/extractor.py`

- [ ] **Step 1: Update requirements.txt**

Replace `google-generativeai` with `openai`. The file should be:

```
numpy<2.0
fastapi
uvicorn
bullmq
langextract
openai
python-dotenv
boto3
pydantic
watchfiles
```

- [ ] **Step 2: Rewrite extractor.py**

Replace the entire contents of `workers/extraction-service/src/extractor.py` with:

```python
import os
import logging
import json
import textwrap
from openai import OpenAI
import langextract as lx
from langextract.data import ExampleData, Extraction

logger = logging.getLogger(__name__)

# Monkeypatch langextract to log raw model output
from langextract.core.format_handler import FormatHandler
original_parse_output = FormatHandler.parse_output
def patched_parse_output(self, text, *args, **kwargs):
    logger.debug(f"RAW MODEL OUTPUT RECEIVED BY LANGEXTRACT: {repr(text)}")
    return original_parse_output(self, text, *args, **kwargs)
FormatHandler.parse_output = patched_parse_output

FREELLM_BASE_URL = os.getenv("FREELLM_BASE_URL", "http://freellm:3000/v1")
LLM_DEFAULT_MODEL = os.getenv("LLM_DEFAULT_MODEL", "free-smart")

_llm_client = OpenAI(
    base_url=FREELLM_BASE_URL,
    api_key="freellm",
)

def run_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = None,
    extraction_type: str = "llm",
    examples: list = None
) -> dict:
    """
    Main entry point for extraction.
    """
    resolved_model = model_id or LLM_DEFAULT_MODEL
    logger.info(f"Running extraction (type: {extraction_type}) with model {resolved_model}...")

    if extraction_type == "langextract":
        return run_langextract_extraction(content, schema_config, resolved_model, examples)
    else:
        return run_llm_extraction(content, schema_config, system_prompt, resolved_model)

def run_llm_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = None
) -> dict:
    """
    Uses FreeLLM (OpenAI-compatible gateway) for extraction.
    """
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

        full_prompt = f"{prompt_instruction}\n\nDocument Content:\n{content}"

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

def run_langextract_extraction(
    content: str,
    schema_config: dict,
    model_id: str,
    raw_examples: list
) -> dict:
    """
    Uses the LangExtract library for complex, few-shot extraction.
    Points at FreeLLM as the OpenAI-compatible backend.
    """
    try:
        lx_examples = []
        if raw_examples:
            for ex in raw_examples:
                extractions = []
                raw_exts = ex.get('extractions') or ex.get('fields') or []
                for ext in raw_exts:
                    extractions.append(lx.data.Extraction(
                        extraction_class=ext.get('extraction_class') or ext.get('class') or "general",
                        extraction_text=ext.get('extraction_text') or ext.get('text') or "",
                        attributes=ext.get('attributes') or {}
                    ))
                lx_examples.append(lx.data.ExampleData(
                    text=ex.get('text') or ex.get('full_text') or "",
                    extractions=extractions
                ))

        fields_desc = "\n".join([
            f"- {f['name']} ({f['type']}): {f.get('description', '')}"
            for f in schema_config.get('fields', [])
        ])
        prompt_description = schema_config.get('prompt') or schema_config.get('description') or textwrap.dedent(f"""\
            Extract entities and their relationships from the text.
            Use exact text for extractions. Do not paraphrase.

            Fields/Classes:
            {fields_desc}
        """)

        logger.info(f"Inputs to lx.extract - model_id: {model_id}, model_url: {FREELLM_BASE_URL}")
        logger.debug(f"Prompt description: {prompt_description}")
        logger.debug(f"Number of examples: {len(lx_examples)}")

        result = lx.extract(
            text_or_documents=content,
            prompt_description=prompt_description,
            examples=lx_examples,
            model_id=model_id,
            model_url=FREELLM_BASE_URL,
            api_key="freellm",
            fence_output=False,
            use_schema_constraints=False
        )
        logger.info(f"lx.extract result: {result}")

        serializable_result = []
        if hasattr(result, 'extractions'):
            for ext in result.extractions:
                serializable_result.append({
                    "class": ext.extraction_class,
                    "text": ext.extraction_text,
                    "attributes": ext.attributes
                })

        return {
            "data": serializable_result,
            "usage": {"total_tokens": 0}
        }

    except Exception as e:
        logger.exception(f"LangExtract extraction failed: {e}")
        raise e
```

- [ ] **Step 3: Commit**

```bash
git add workers/extraction-service/requirements.txt workers/extraction-service/src/extractor.py
git commit -m "feat(extraction-service): replace google-generativeai with openai client pointing at FreeLLM"
```

---

## Task 13: Regenerate frontend API client

**Files:**
- Modify: `client/src/api/models/` (auto-generated by Orval)

The `ExtractionProvider` enum value changed from `'ollama'` to `'freellm'`. Orval regenerates this from the Swagger spec.

- [ ] **Step 1: Start the server**

```bash
docker compose up -d server db redis
```

Wait ~10 seconds for the server to start.

- [ ] **Step 2: Regenerate the API client**

```bash
cd client && pnpm run gen:api
```

Expected: Files in `src/api/models/` and `src/api/endpoints/` are updated. No errors.

- [ ] **Step 3: Check the enum in generated models**

```bash
grep -r "freellm\|ollama" src/api/models/ | head -10
```

Expected: `freellm` appears, `ollama` does not.

- [ ] **Step 4: Search for any hardcoded 'ollama' strings in frontend source**

```bash
grep -r "'ollama'\|\"ollama\"" src/ --include="*.ts" --include="*.tsx" | grep -v api/
```

If any results appear outside `src/api/`, update those UI labels from `"Ollama"` / `"ollama"` to `"FreeLLM"` / `"freellm"`.

- [ ] **Step 5: Verify frontend builds**

```bash
pnpm run build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
cd ..
git add client/src/api/
git commit -m "chore(client): regenerate API client after ExtractionProvider.OLLAMA → FREELLM rename"
```

---

## Task 14: Smoke test end-to-end

- [ ] **Step 1: Set at least one provider API key**

Add a `GROQ_API_KEY` or `GEMINI_API_KEY` to `server/.env` (for local dev, the FreeLLM container reads these from environment):

```bash
# In docker-compose.yml environment or .env:
# GROQ_API_KEY=gsk_...
# GEMINI_API_KEY=AIza...
```

- [ ] **Step 2: Start the full stack**

```bash
docker compose up -d --build
```

Wait for all services to be healthy (~30s).

- [ ] **Step 3: Verify FreeLLM is running**

```bash
curl -s http://localhost:3002/v1/status | head -5
```

Expected: JSON response (not an error).

- [ ] **Step 4: Create a test run with freellm provider**

Via the UI or curl: create a run with `extractionProvider: "freellm"`. Verify the run completes without errors (check run logs in the UI or via API).

- [ ] **Step 5: Verify schema generation still works**

In the UI, open an extractor and use "Generate Schema" — this calls `ExtractorsService.generateSchema()` which now uses `LlmService.generate()`.

Expected: A valid JSON schema is returned.
