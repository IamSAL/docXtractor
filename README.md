# DocXtractor


<img width="1015" height="703" alt="image" src="https://github.com/user-attachments/assets/a690802d-16da-467f-92e3-898af4fbb2f5" />

**Turn any document into structured, validated JSON — without writing a parser.**
DocXtractor is a full-stack platform for extracting structured data out of messy, unstructured documents (PDFs, spreadsheets, scanned files, web pages). You describe *what* you want — a JSON schema and a plain-English prompt — and the system parses the document, runs an LLM against it, and returns clean, typed JSON you can review, correct, and export.

> ⚙️ **Built with Claude Code.** This project was developed end-to-end with [Claude Code](https://claude.ai/code) — architecture, backend, workers, and frontend. The UI was designed using [Google Stitch](https://stitch.withgoogle.com/) and implemented from those designs.

---

## The Problem

Getting structured data out of documents is painful:

- **PDFs and scans are unstructured** — tables, columns, and layout are lost the moment you `pdftotext` them.
- **Every document type needs a bespoke parser** — a financial prospectus, an invoice, and a lab report share nothing.
- **Regex and template parsers break** the instant a vendor changes their layout.
- **Raw LLM calls are unreliable** — they hallucinate fields, drift from your schema, and give you no way to review or correct the output.

DocXtractor solves this by combining **document-aware parsing** (layout, OCR, tables → Markdown) with **schema-constrained LLM extraction** (your JSON schema + prompt → validated JSON), wrapped in a UI where you define extractors once and run them against many documents with live progress and human review.

## How It Works

An **Extractor** is a reusable config: a **JSON schema**, a **system prompt**, and optional **few-shot examples**. You point it at one or more sources (uploaded files or URLs) and trigger a **Run**. Each run flows through an asynchronous, queue-driven pipeline:

```
Upload (file / URL)
  → NestJS API                          (creates Run, dispatches jobs)
  → [queue] uploaded-documents
  → Parser Service   (Python · Docling + RapidOCR)   → document to Markdown
  → [queue] parsed-documents
  → NestJS API                          (queues extraction)
  → [queue] extraction-requests
  → Extraction Service (Python · LLM / LangExtract)  → structured JSON
  → [queue] extraction-completed
  → NestJS API        (persists result, emits WebSocket events)
  → React Client      (live status, results table, review UI)
```

Every stage reports back over WebSockets, so the client shows real-time status per document (`pending → parsing → extracting → done / review / failed`) instead of a spinner.

## How AI / LLMs Are Used

AI is the core of the product, applied at three distinct points:

### 1. Schema generation from natural language
When you create an Extractor, you don't have to hand-write JSON Schema. Describe the fields you want in plain English and an LLM generates the schema for you. The `ExtractorsModule` calls the LLM gateway to turn intent into a structured, editable schema.

### 2. Document parsing (layout & OCR intelligence)
The **parser-service** uses [**Docling**](https://github.com/DS4SD/docling) with **RapidOCR** to convert documents into clean Markdown while preserving structure — tables, headings, reading order — and OCR-ing scanned or image-based pages. This gives the LLM a faithful, text-native view of the document instead of garbled PDF dumps.

### 3. Schema-constrained extraction
The **extraction-service** takes the parsed Markdown plus the Extractor's schema, prompt, and few-shot examples, and produces JSON that conforms to the schema. It supports multiple extraction backends:

- **FreeLLM gateway** — an OpenAI-compatible endpoint fronting free/rotating providers (**Groq, Gemini, Mistral, Cerebras**), so the platform isn't locked to a single vendor or a paid key.
- **[LangExtract](https://github.com/google/langextract)** — Google's grounded-extraction library, for source-attributed field extraction.

Runs can process documents in **batch and in parallel** (`Promise.allSettled` on the NestJS side; configurable concurrency in the Python workers), and results that need a human check are routed to a `review` state rather than silently accepted.

### The LLM gateway: FreeLLM
Instead of calling a provider SDK directly, the backend talks to **FreeLLM** — a self-hosted, OpenAI-compatible gateway that runs as a service in the stack (model id: `free`). This keeps model access swappable and keeps the app code provider-agnostic: NestJS and the Python extraction worker both point at the same base URL.

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Backend API** | NestJS (TypeScript), TypeORM, JWT + Google OAuth, Swagger |
| **Frontend** | React 19, TanStack Start / Router / Query / Table, Vite, Tailwind CSS v4, Radix UI, custom "RetroUI" neobrutalist components, Monaco editor |
| **Parser worker** | Python · FastAPI · Docling · RapidOCR |
| **Extraction worker** | Python · FastAPI · OpenAI-compatible client · LangExtract |
| **LLM access** | FreeLLM gateway (Groq / Gemini / Mistral / Cerebras) |
| **Queue / jobs** | BullMQ on Redis (4 queues bridging NestJS ↔ Python workers) |
| **Database** | PostgreSQL (TypeORM migrations, auto-applied on boot) |
| **Object storage** | MinIO (uploaded files + run logs) |
| **Real-time** | Socket.IO (`/runs` namespace) |
| **API client** | Orval — typed TanStack Query hooks generated from the Swagger spec |
| **Email** | Brevo (SMTP) for transactional mail |
| **Infra** | Docker Compose (dev / stage / prod), nginx, Cloudflare tunnel |

### Architecture notes

- **Async pipeline over BullMQ** — NestJS and the Python workers communicate purely through Redis-backed queues, so parsing and extraction scale independently and don't block the API.
- **Type-safe front-to-back** — the OpenAPI spec drives Orval, which generates the client's API hooks, models, and Zod schemas; a backend DTO change flows to the frontend via `pnpm run gen:api`.
- **Migrations, never `synchronize`** — schema changes are committed as TypeORM migration files and applied automatically on container start (fresh deploys build the schema from migrations, no manual SQL).

## Getting Started

Requirements: **Docker & Docker Compose**, **Node 18+**, **pnpm**.

```bash
# 1. Configure environment
cp server/env.example server/.env
# also create workers/extraction-service/.env with FREELLM_BASE_URL + LANGEXTRACT_API_KEY

# 2. Bring up the full stack (API, client, workers, FreeLLM, Postgres, Redis, MinIO)
docker-compose up -d --build
```

Migrations run automatically on server boot. Once up:

| Service | URL |
| --- | --- |
| React Client | http://localhost:5174 |
| NestJS API | http://localhost:3001 |
| API docs (Swagger) | http://localhost:3001/api  (`admin` / `admin`) |
| MinIO Console | http://localhost:9006 |

### Running pieces individually

```bash
# NestJS API (server/)
pnpm run start:dev

# React client (client/)
pnpm run dev            # Vite dev server
pnpm run gen:api        # regenerate typed API client after backend changes

# Python workers
cd workers/parser-service     && uvicorn src.main:app --port 8001 --reload
cd workers/extraction-service && uvicorn src.main:app --port 8002 --reload
```

See [`CLAUDE.md`](./CLAUDE.md) for the full development guide — module layout, queue contracts, WebSocket events, migration workflow, and agent runbook.

## Repository Layout

```
docXtractor/
├── server/     # NestJS API — extractors, runs, files, auth, LLM gateway, queues
├── client/     # React + TanStack Start frontend (UI designed in Google Stitch)
├── workers/
│   ├── parser-service/       # Python · Docling + RapidOCR → Markdown
│   └── extraction-service/   # Python · LLM / LangExtract → structured JSON
├── migrations/ # TypeORM migrations
├── infra/      # nginx configs, deployment
└── docs/       # PRD, design specs, audits, plans
```

## License

MIT
