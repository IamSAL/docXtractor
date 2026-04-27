# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DocXtractor is a full-stack document data extraction platform. Users define **Extractors** (schema + system prompt), upload files/URLs, trigger **Runs** that parse documents and extract structured JSON data using AI models via FreeLLM (Groq, Gemini, Mistral, Cerebras).

## Commands

### Docker (recommended — runs everything)

```bash
docker-compose up -d --build
```

FreeLLM runs as a Docker service alongside everything else.

### NestJS Server (`server/`)

```bash
pnpm run start:dev      # Dev with watch
pnpm run build
pnpm run test           # Jest unit tests
pnpm run test:e2e
pnpm run test -- --testPathPattern=<file>  # Single test file
pnpm run lint           # ESLint (flat config + typescript-eslint + Prettier)
```

### React Client (`client/`)

```bash
pnpm run dev            # Vite dev server :5173
pnpm run build
pnpm run gen:api        # Regenerate typed API client via Orval
pnpm run check          # Biome lint + format
pnpm run lint           # Biome lint only
pnpm run format         # Biome format only
```

### Python Workers

```bash
# parser-service
cd workers/parser-service && uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload

# extraction-service
cd workers/extraction-service && uvicorn src.main:app --host 0.0.0.0 --port 8002 --reload
```

## Architecture

### Data Flow (document processing pipeline)

```
Upload (file/URL)
  → NestJS [FilesModule + RunsModule]
  → BullMQ queue: "uploaded-documents"
  → Parser Service (Python/Docling) → parses to Markdown
  → BullMQ queue: "parsed-documents"
  → NestJS [RunsModule] → queues extraction
  → BullMQ queue: "extraction-requests"
  → Extraction Service (Python/Gemini/LangExtract) → structured JSON
  → BullMQ queue: "extraction-completed"
  → NestJS [RunsModule] → persists result, emits WebSocket events
  → React Client (live status via Socket.IO /runs namespace)
```

### Backend (`server/`) — NestJS

Key modules:

- **`ExtractorsModule`** — CRUD for extractor configs; calls FreeLLM to generate schemas from natural language
- **`RunsModule`** — Core orchestration: creates runs, dispatches queue jobs, handles callbacks, emits WebSocket events, stores logs to MinIO. In batch mode with FreeLLM provider, extractions run in parallel using `Promise.allSettled`
- **`RunsGateway`** — Socket.IO WebSocket gateway (`/runs` namespace)
- **`FilesModule`** — File upload, MinIO storage
- **`QueueModule`** (`shared/queue/`) — Global BullMQ setup for all 4 queues
- **`AuthModule`** — JWT + Google OAuth, guards, strategies
- **`LlmModule`** (`shared/llm/`) — Global LLM client via FreeLLM (model: `free`)
- **`MailModule`** (`shared/mail/`) — Email sending via Brevo (SendGrid) SMTP

Key entities:

- **`Extractor`**: `schema` (JSONB), `systemPrompt`, `fewShotExamples` (JSONB), `extractionProvider` enum (`doclo` | `langextract` | `freellm`)
- **`Run`**: `status` enum (`pending`→`queued`→`parsing`→`extracting`→`done`/`failed`/`cancelled`/`review`), `sources` (JSONB array with per-source parse status), `extractionResult` (JSONB), `processingMode` (`unified` | `per_document`)
- **`File`**: `storageKey`, `bucket`, `status` enum, `metadata` (JSONB) — stored in MinIO
- **`User`**: UUID PK, `email`, `passwordHash`, `googleId`, `role` (user/admin), `isEmailVerified`

**Auth pattern**: All routes are JWT-protected by default via global `AccessTokenGuard`. Use the `@Public()` decorator to make endpoints public. Global guards are applied in order: `ThrottlerGuard` → `AccessTokenGuard` → `RolesGuard`.

**Database**: TypeORM with migrations. `synchronize` is OFF in all envs; `migrationsRun: true` auto-applies pending migrations on app boot. Workflow after editing any `*.entity.ts`:

1. From `server/`, run: `DATABASE_URL=postgres://postgres:postgres@localhost:5433/docxtractor npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d ./src/database/data-source.ts ./src/migrations/<ShortName>` (dev DB must be reachable on `localhost:5433`).
2. Review the generated file in `server/src/migrations/`.
3. Commit it alongside the entity change.
4. Next app boot — local restart or fresh VPS deploy — applies it automatically.

Fresh VPS first deploy: schema is built from migration files on container start; no manual SQL needed.

**Swagger**: Available at `/api` (basic auth: `admin`/`admin`). JSON spec at `/api/swagger.json` (consumed by Orval).

### BullMQ Queues

| Queue Name             | Producer                  | Consumer                           |
| ---------------------- | ------------------------- | ---------------------------------- |
| `uploaded-documents`   | NestJS RunsService        | Python parser-service              |
| `parsed-documents`     | Python parser-service     | NestJS ParsedDocumentsConsumer     |
| `extraction-requests`  | NestJS RunsService        | Python extraction-service          |
| `extraction-completed` | Python extraction-service | NestJS ExtractionCompletedConsumer |

Queue names are defined in `server/src/shared/queue/queue-names.ts`. NestJS consumers extend `WorkerHost` in `queue-consumers.ts`. Python workers use the `bullmq` Python package directly with Redis URL.

### Frontend (`client/`) — React 19 + TanStack Start

- **Routing**: TanStack Router (file-based, in `src/routes/`)
- **Data fetching**: TanStack Query v5 via Orval-generated hooks
- **API client**: Auto-generated by Orval into `src/api/endpoints/` (hooks) and `src/api/models/` (types) + `src/api/schemas/` (Zod). Run `pnpm run gen:api` after any backend DTO/controller change.
- **HTTP client**: Custom Axios instance in `src/lib/axios.ts` — auto-attaches JWT, handles 401 with token refresh
- **Auth state**: Zustand store in `src/lib/auth-store.ts` — persisted to cookies (SSR-compatible)
- **Real-time**: socket.io-client in `src/lib/socket.ts` subscribing to `/runs` namespace
- **UI components**: Custom "RetroUI" neobrutalist components in `src/components/retroui/`, plus Radix UI + Tailwind CSS v4
- **Modals**: `@ebay/nice-modal-react`
- **Forms**: react-hook-form + zod resolvers
- **Tables**: TanStack Table (spreadsheet view of extraction results)
- **Code editor**: Monaco Editor (for schema/prompt editing)
- **Path alias**: `@/*` maps to `./src/*`

### Python Workers

- **`parser-service`** (`:8001`): Receives jobs from `uploaded-documents` queue. Uses Docling + RapidOCR to convert documents/URLs to Markdown. Fetches files from MinIO via boto3. **Parallel processing**: Concurrency configurable via `PARSER_CONCURRENCY` env var (default: 4).
- **`extraction-service`** (`:8002`): Receives jobs from `extraction-requests` queue. Uses OpenAI-compatible client pointed at FreeLLM gateway, or LangExtract library. Returns structured JSON. **Parallel processing**: Concurrency configurable via `EXTRACTION_CONCURRENCY` env var (default: 3).

### WebSocket Events (`/runs` namespace)

- **Rooms**: `run:{runId}` (per-run updates), `runs:list` (list-level updates)
- **Client events**: `joinRun`, `leaveRun`, `joinRunsList`, `leaveRunsList`
- **Server events**: `run:updated`, `run:source:updated`, `run:log`, `runs:list:updated`

### Infrastructure Ports

| Service            | Port |
| ------------------ | ---- |
| React Client       | 5174 |
| NestJS API         | 3001 |
| PostgreSQL         | 5433 |
| Redis (BullMQ)     | 6380 |
| MinIO API          | 9005 |
| MinIO Console      | 9006 |
| Parser Service     | 8001 |
| Extraction Service | 8002 |
| FreeLLM            | 3002 |

## Development Patterns

### Adding a new API endpoint

1. Create service/controller/DTOs in `server/src/<module>/`
2. Restart the server so Swagger updates
3. Run `pnpm run gen:api` in `client/` to regenerate typed hooks and models
4. Use the generated TanStack Query hooks in your components

### Linting

- **Server**: ESLint (flat config) + Prettier. `@typescript-eslint/no-explicit-any` is off. Run `pnpm run lint`.
- **Client**: Biome v2. Tabs, double quotes for JS. Run `pnpm run check`. Orval's after-write hook runs `biome format --write` on generated code.

### Client Cursor Rules

- Sentry is configured in `src/router.tsx` for error collection. Instrument server functions with `Sentry.startSpan`.
- Install shadcn components via: `pnpm dlx shadcn@latest add <component>`

## Environment Setup

Copy `server/env.example` to `server/.env`. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `REDIS_HOST`, `REDIS_PORT` (default: `localhost:6380`)
- `FREELLM_BASE_URL` (default: `http://freellm:3002/v1`), `LLM_DEFAULT_MODEL` (default: `free`)
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` — Brevo SMTP for transactional email
- `GOOGLE_CLIENT_ID/SECRET` — OAuth

The extraction-service needs its own `.env` with `FREELLM_BASE_URL` and `LANGEXTRACT_API_KEY`.

# Special Important Instructions

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
