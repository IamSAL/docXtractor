# FreeLLM Generic LLM Provider — Design Spec

**Date:** 2026-04-13
**Status:** Approved

## Problem

DocXtractor is tightly coupled to Ollama. Two Ollama Docker containers run in `docker-compose.yml`, the NestJS `OllamaService` uses the `ollama` npm package with custom node pooling, and the Python extraction-service hardcodes `LANGEXTRACT_MODEL_URL=http://ollama1:11434`. Switching models or providers requires infrastructure changes throughout the stack.

## Goal

Replace all Ollama coupling with [FreeLLM](https://github.com/Devansh-365/freellm) — an OpenAI-compatible LLM gateway that aggregates Groq, Gemini, Mistral, Cerebras, and NVIDIA NIM behind a single API. Every LLM call in the system (NestJS + both Python workers) routes through FreeLLM.

## Decisions

| Decision                  | Choice                                              | Reason                                                  |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| JSON output strategy      | `response_format: { type: "json_object" }` + prompt | Works with all OpenAI-compatible providers              |
| LLM client (NestJS)       | `openai` npm package                                | Full TS types, standard OpenAI-compatible SDK           |
| Python LLM client         | `openai` Python package                             | Same gateway, same interface                            |
| Default model             | `free`                                              | Most capable routing (Gemini → NIM → Groq → Mistral)    |
| Local Ollama              | Removed entirely                                    | FreeLLM provides cloud providers; no local model needed |
| `ExtractionProvider` enum | `ollama` → `freellm`                                | Reflects actual backend                                 |

---

## Section 1: Docker / Infrastructure

### Remove

- `ollama1` and `ollama2` services and named volumes (`ollama1_data`, `ollama2_data`)
- `server` env vars: `OLLAMA_HOSTS`, `OLLAMA_HOST`, `OLLAMA_DEFAULT_MODEL`, `OLLAMA_GENERATION_MODEL`
- `extraction-service` env var: `LANGEXTRACT_MODEL_URL`
- `server` `depends_on: ollama1/ollama2`

### Add `freellm` service

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

### Updated env vars

**`server`:**

```
FREELLM_BASE_URL=http://freellm:3000/v1
LLM_DEFAULT_MODEL=free
LLM_MAX_CONCURRENCY=5
```

**`extraction-service`:**

```
FREELLM_BASE_URL=http://freellm:3000/v1
LLM_DEFAULT_MODEL=free
```

---

## Section 2: NestJS `LlmModule`

### File changes

- `server/src/shared/ollama/` directory → `server/src/shared/llm/`
- `ollama.module.ts` → `llm.module.ts` (export `LlmService`)
- `ollama.service.ts` → `llm.service.ts` (`LlmService`)

### Dependencies

- Remove: `ollama` npm package
- Add: `openai` npm package

### `LlmService` internals

```typescript
@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly generationModel: string;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: configService.get("FREELLM_BASE_URL", "http://freellm:3000/v1"),
      apiKey: "freellm",
    });
    this.defaultModel = configService.get("LLM_DEFAULT_MODEL", "free");
  }

  // Both use this.defaultModel when model param is omitted
  async extract(
    content,
    schema,
    systemPrompt,
    model?,
  ): Promise<LlmExtractionResult>;
  async generate(prompt, model?): Promise<Record<string, unknown>>;
}
```

### What is removed

- `Semaphore` class — FreeLLM handles concurrency internally
- Node pool (`OllamaNode[]`), round-robin (`getNextNode()`), `markUnhealthy()` — FreeLLM handles failover
- Health check `setInterval` / `runHealthChecks()` — unnecessary
- `onModuleInit` model-pull loop — unnecessary
- Ollama-specific `format: schema` structured output param

### What is kept

- `extract()` and `generate()` public method signatures — callers unchanged
- Simple retry loop (3 attempts, exponential backoff)
- Rate limit detection via HTTP `429` status → backoff + retry

### JSON output

Both methods use `response_format: { type: "json_object" }` and include "Return a valid JSON object" in the prompt. `jsonrepair` is kept for parsing resilience.

### Callers

- `RunsService`: inject `LlmService` instead of `OllamaService` — no logic changes
- `ExtractorsService`: same — inject `LlmService`, no logic changes
- `AppModule`: import `LlmModule` instead of `OllamaModule`

---

## Section 3: `ExtractionProvider` Enum Rename

### Code change (`extractor.entity.ts`)

```typescript
export enum ExtractionProvider {
  FREELLM = "freellm", // was: OLLAMA = 'ollama'
  DOCLO = "doclo",
  LANGEXTRACT = "langextract",
}
```

### Database migration (run once before restart)

TypeORM `synchronize: true` does not rename Postgres enum values. Run manually:

```sql
ALTER TYPE extractor_extraction_provider_enum RENAME VALUE 'ollama' TO 'freellm';
```

### All references to update

- `extractor.entity.ts` — enum definition
- `create-extractor.dto.ts`, `update-extractor.dto.ts` — DTO validation values
- `runs.service.ts` — 4 branches checking `ExtractionProvider.OLLAMA` → `ExtractionProvider.FREELLM`
- `server/env.example` — any default references
- Frontend: regenerate API client (`pnpm run gen:api`), update UI labels "ollama" → "FreeLLM"

---

## Section 4: Python `extraction-service`

### Dependencies

- Remove: `google-generativeai` from `requirements.txt`
- Add: `openai` Python package

### `run_llm_extraction` rewrite

Replace `google.generativeai` SDK with OpenAI-compatible client:

```python
from openai import OpenAI

client = OpenAI(
    base_url=os.getenv("FREELLM_BASE_URL", "http://freellm:3000/v1"),
    api_key="freellm",
)

response = client.chat.completions.create(
    model=os.getenv("LLM_DEFAULT_MODEL", "free"),
    messages=[{"role": "user", "content": full_prompt}],
    response_format={"type": "json_object"},
)
result_data = json.loads(response.choices[0].message.content)
```

### `run_langextract_extraction`

LangExtract supports OpenAI-compatible endpoints via `model_url`. Update:

```python
model_url = os.getenv("FREELLM_BASE_URL", "http://freellm:3000/v1")
```

### Env vars removed

`GOOGLE_API_KEY`, `LANGEXTRACT_API_KEY`

### Env vars added

`FREELLM_BASE_URL`, `LLM_DEFAULT_MODEL`

---

## Out of Scope

- FreeLLM virtual keys / rate limiting per tenant
- Streaming responses
- Token usage reporting from FreeLLM (FreeLLM returns OpenAI-compatible usage objects — can be wired up later)
- `parser-service` changes (no LLM usage there)
