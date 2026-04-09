# OpenDataLoader PDF Engine Integration Design

**Date:** 2026-04-09
**Status:** Approved

## Goal

Add opendataloader-pdf as a 4th parser engine plugin to make PDF parsing significantly faster (20+ pages/sec local mode) while keeping the existing engine options available. Engine selection is per-extractor (UI configurable), giving users control over the speed/accuracy trade-off per use case.

## Context

### Current Architecture

Parser-service uses a plugin-based engine pattern with 3 engines:

- **DoclingEngine** (default) — AI-powered, good accuracy, slower (~1-2 pages/sec)
- **MarkItDownEngine** — Lightweight multi-format, moderate quality
- **PyMuPdfEngine** — Basic PDF text extraction, fast but low quality

Engine selected globally via `PARSER_ENGINE` env var. Jobs flow through BullMQ (`uploaded-documents` → parser → `parsed-documents`).

### opendataloader-pdf

Java-core PDF parser with Python SDK. Two modes:

- **Local mode:** 20+ pages/sec on CPU, deterministic, no AI, no GPU — selected for this integration
- **Hybrid mode:** 0.90 accuracy (#1 ranked), requires separate backend server — deferred to future enhancement

Key features: bounding boxes per element, prompt injection protection, PII sanitization, XY-Cut++ reading order.

Caveat: Python SDK spawns JVM per `convert()` call — batching multiple files recommended.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration approach | Engine plugin in parser-service | Fits existing architecture, minimal changes |
| Mode | Local only (for now) | No extra infrastructure, 20x speed gain sufficient |
| JVM dependency | Add JRE to parser-service Docker image | ~200-300MB image size increase, acceptable trade-off |
| Engine selection | Per-extractor (UI configurable) | Users choose engine per use case via extractor config |
| Hybrid mode | Deferred | Can add as optional sidecar later |

## Data Model Changes

### Extractor Entity

New column:

```
parserEngine: enum('docling', 'markitdown', 'pymupdf', 'opendataloader')
  default: 'docling'
```

Added to CreateExtractorDto and UpdateExtractorDto.

### Job Payload (uploaded-documents queue)

New field:

```json
{
  "parser_engine": "opendataloader"
}
```

If absent, falls back to `PARSER_ENGINE` env var (backwards compatible).

### Parse Cache Key

Changed from `parse_cache:{file_hash}` to `parse_cache:{engine_name}:{file_hash}` — different engines produce different markdown output.

## Implementation: OpenDataLoaderEngine

New file: `workers/parser-service/src/engines/opendataloader_engine.py`

Extends `ParserEngine` abstract base class:

- `parse_file(file_bytes, filename)` — writes to temp file, calls `opendataloader_pdf.convert(format="markdown")`, reads output, returns `ParseResult`
- `parse_url(url)` — downloads to temp file, same flow
- Temp files: `/tmp/opendataloader_*` prefix, cleaned up after each job

Configuration env vars:

```
OPENDATALOADER_USE_STRUCT_TREE=true
OPENDATALOADER_READING_ORDER=xycut
OPENDATALOADER_TABLE_METHOD=cluster
OPENDATALOADER_INCLUDE_HEADER_FOOTER=false
OPENDATALOADER_KEEP_LINE_BREAKS=true
OPENDATALOADER_SANITIZE=false
OPENDATALOADER_CONTENT_SAFETY=true
```

## Engine Routing

Engines are lazy-initialized singletons in a registry. Consumer reads `parser_engine` from each job's payload:

```python
engine_name = job.data.get("parser_engine", os.getenv("PARSER_ENGINE", "docling"))
engine = get_engine(engine_name)
```

Multiple engines can be active simultaneously.

## NestJS Server Changes

- **Extractor entity:** Add `parserEngine` column with enum and default
- **RunsService:** Include `parser_engine: extractor.parserEngine` in job payload when queuing to `uploaded-documents`
- **DTOs/Swagger:** Expose new field

No changes to: queue consumers, extraction pipeline, WebSocket events, file upload.

## Frontend Changes

- **Extractor config form:** Add "Parser Engine" dropdown with descriptions
- **Run results UI:** No changes (markdown output is engine-agnostic)

## Docker Changes

**parser-service Dockerfile:**

```dockerfile
RUN apt-get install -y openjdk-17-jre-headless
```

**requirements.txt:**

```
opendataloader-pdf
```

No new Docker services needed (local mode only).

## Future Enhancements (Out of Scope)

- **Hybrid mode:** Add `opendataloader-pdf-hybrid` as optional Docker sidecar for complex document accuracy boost
- **Auto-detection:** Smart routing that picks opendataloader for simple PDFs and Docling for complex ones
- **Batch optimization:** Accumulate multiple jobs and batch them into a single `convert()` call to amortize JVM startup
