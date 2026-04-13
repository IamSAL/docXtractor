# OpenDataLoader PDF Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opendataloader-pdf as a 4th parser engine plugin with per-extractor engine selection, making PDF parsing 20x faster for simple documents.

**Architecture:** New `OpenDataLoaderEngine` extends the existing `ParserEngine` ABC. Engine routing refactored from global singleton to a lazy-initialized registry keyed by engine name. Per-extractor engine selection flows from the NestJS `Extractor` entity through BullMQ job payloads to the Python parser-service consumer.

**Tech Stack:** Python (opendataloader-pdf SDK), NestJS/TypeORM (entity + DTO), React (form dropdown), Docker (JRE for JVM dependency)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `workers/parser-service/src/engines/opendataloader_engine.py` | OpenDataLoader engine plugin |
| Modify | `workers/parser-service/src/parser_engine.py` | Engine registry (singleton → multi-engine) |
| Modify | `workers/parser-service/src/engines/__init__.py` | Export new engine |
| Modify | `workers/parser-service/src/parse_cache.py` | Engine-aware cache keys |
| Modify | `workers/parser-service/src/consumer.py` | Per-job engine routing |
| Modify | `workers/parser-service/requirements.txt` | Add opendataloader-pdf |
| Modify | `workers/parser-service/Dockerfile` | Add JRE to runtime image |
| Modify | `server/src/extractors/entities/extractor.entity.ts` | `parserEngine` column |
| Modify | `server/src/extractors/dto/create-extractor.dto.ts` | `parserEngine` DTO field |
| Modify | `server/src/runs/runs.service.ts` | `parser_engine` in job payload |
| Modify | `client/src/types/extractor.ts` | `parserEngine` type + default |
| Modify | `client/src/components/extractors/ExtractionSettings.tsx` | Parser engine dropdown |

---

### Task 1: Engine-Aware Parse Cache

The cache key currently uses `parse_cache:{file_hash}`. Different engines produce different markdown for the same file, so the key must include the engine name.

**Files:**
- Modify: `workers/parser-service/src/parse_cache.py`

- [ ] **Step 1: Update `get_cached_result` and `set_cached_result` signatures**

Add `engine_name` parameter to both functions. Update the Redis key format to `parse_cache:{engine_name}:{file_hash}`.

```python
def get_cached_result(file_hash: str, engine_name: str = "docling") -> dict | None:
    if not CACHE_ENABLED:
        return None
    try:
        key = f"{CACHE_PREFIX}{engine_name}:{file_hash}"
        data = _get_redis().get(key)
        if data:
            logger.info(f"Cache HIT for {engine_name}:{file_hash[:12]}...")
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")
    return None


def set_cached_result(file_hash: str, result: dict, engine_name: str = "docling"):
    if not CACHE_ENABLED:
        return
    try:
        key = f"{CACHE_PREFIX}{engine_name}:{file_hash}"
        _get_redis().setex(
            key,
            CACHE_TTL,
            json.dumps(result),
        )
        logger.info(f"Cached result for {engine_name}:{file_hash[:12]}... (TTL={CACHE_TTL}s)")
    except Exception as e:
        logger.warning(f"Cache store failed: {e}")
```

- [ ] **Step 2: Update DoclingEngine to pass engine name to cache functions**

In `workers/parser-service/src/engines/docling_engine.py`, update all calls to `get_cached_result` and `set_cached_result` to pass `self.name` as the `engine_name` parameter.

Line 78-80 in `parse_bytes`:
```python
        cached = get_cached_result(file_hash, self.name)
```

Line 109-112:
```python
        set_cached_result(file_hash, {
            "markdown_content": parse_result.markdown_content,
            "token_count": parse_result.token_count,
        }, self.name)
```

Line 128 in `parse_url`:
```python
            cached = get_cached_result(file_hash, self.name)
```

Line 140-143:
```python
            set_cached_result(file_hash, {
                "markdown_content": parse_result.markdown_content,
                "token_count": parse_result.token_count,
            }, self.name)
```

- [ ] **Step 3: Update PyMuPdfEngine to pass engine name to cache functions**

In `workers/parser-service/src/engines/pymupdf_engine.py`, update all calls:

Line 18:
```python
        cached = get_cached_result(file_hash, self.name)
```

Line 34-37:
```python
        set_cached_result(file_hash, {
            "markdown_content": parse_result.markdown_content,
            "token_count": parse_result.token_count,
        }, self.name)
```

- [ ] **Step 4: Update MarkItDownEngine to pass engine name to cache functions**

Apply the same pattern — find all `get_cached_result(file_hash)` and `set_cached_result(file_hash, ...)` calls and add `self.name` as the second/third argument respectively.

- [ ] **Step 5: Commit**

```bash
git add workers/parser-service/src/parse_cache.py workers/parser-service/src/engines/
git commit -m "feat: engine-aware parse cache keys

Different engines produce different markdown for the same document.
Cache key changed from parse_cache:{hash} to parse_cache:{engine}:{hash}."
```

---

### Task 2: Engine Registry (Singleton to Multi-Engine)

Refactor `get_engine()` from a single global singleton to a lazy-initialized registry that can hold multiple engines simultaneously. This supports per-job engine routing.

**Files:**
- Modify: `workers/parser-service/src/parser_engine.py`

- [ ] **Step 1: Replace singleton with engine registry**

Replace the entire `_engine_instance` and `get_engine()` section (lines 35-59) with a registry pattern:

```python
_engine_registry: dict[str, ParserEngine] = {}
_registry_lock = __import__("threading").Lock()


def get_engine(engine_name: str | None = None) -> ParserEngine:
    """Return the parser engine for the given name. Lazy-initializes on first use."""
    if engine_name is None:
        engine_name = os.getenv("PARSER_ENGINE", "docling").lower()
    else:
        engine_name = engine_name.lower()

    if engine_name in _engine_registry:
        return _engine_registry[engine_name]

    with _registry_lock:
        if engine_name in _engine_registry:
            return _engine_registry[engine_name]

        if engine_name == "markitdown":
            from .engines.markitdown_engine import MarkItDownEngine
            engine = MarkItDownEngine()
        elif engine_name == "docling":
            from .engines.docling_engine import DoclingEngine
            engine = DoclingEngine()
        elif engine_name == "pymupdf":
            from .engines.pymupdf_engine import PyMuPdfEngine
            engine = PyMuPdfEngine()
        elif engine_name == "opendataloader":
            from .engines.opendataloader_engine import OpenDataLoaderEngine
            engine = OpenDataLoaderEngine()
        else:
            raise ValueError(
                f"Unknown parser engine: {engine_name}. "
                "Choose from: docling, markitdown, pymupdf, opendataloader"
            )

        logger.info(f"Parser engine initialized: {engine.name}")
        _engine_registry[engine_name] = engine
        return engine
```

- [ ] **Step 2: Commit**

```bash
git add workers/parser-service/src/parser_engine.py
git commit -m "refactor: engine registry for per-job engine routing

Replaces global singleton with lazy-initialized dict registry.
get_engine() now accepts optional engine_name parameter.
Adds opendataloader to the registry lookup."
```

---

### Task 3: Per-Job Engine Routing in Consumer

Update the consumer to read `parser_engine` from each job's payload and route to the correct engine.

**Files:**
- Modify: `workers/parser-service/src/consumer.py`

- [ ] **Step 1: Update `process_job` to read engine from job payload**

Change line 47 from:
```python
    engine = get_engine()
```

to:
```python
    engine_name = data.get("parser_engine")
    engine = get_engine(engine_name)
```

This reads the engine name from the job payload. If `parser_engine` is absent (backwards compatible), `get_engine(None)` falls back to the `PARSER_ENGINE` env var.

- [ ] **Step 2: Commit**

```bash
git add workers/parser-service/src/consumer.py
git commit -m "feat: per-job engine routing in parser consumer

Reads parser_engine from BullMQ job payload.
Falls back to PARSER_ENGINE env var when absent."
```

---

### Task 4: OpenDataLoader Engine Implementation

Create the new engine plugin that wraps the opendataloader-pdf Python SDK.

**Files:**
- Create: `workers/parser-service/src/engines/opendataloader_engine.py`
- Modify: `workers/parser-service/src/engines/__init__.py`

- [ ] **Step 1: Create the engine file**

Create `workers/parser-service/src/engines/opendataloader_engine.py`:

```python
import os
import tempfile
import logging
from hashlib import sha256

from ..parser_engine import ParserEngine, ParseResult
from ..parse_cache import get_cached_result, set_cached_result

logger = logging.getLogger(__name__)

# Configuration via environment variables
USE_STRUCT_TREE = os.getenv("OPENDATALOADER_USE_STRUCT_TREE", "true").lower() == "true"
READING_ORDER = os.getenv("OPENDATALOADER_READING_ORDER", "xycut")
TABLE_METHOD = os.getenv("OPENDATALOADER_TABLE_METHOD", "cluster")
INCLUDE_HEADER_FOOTER = os.getenv("OPENDATALOADER_INCLUDE_HEADER_FOOTER", "false").lower() == "true"
KEEP_LINE_BREAKS = os.getenv("OPENDATALOADER_KEEP_LINE_BREAKS", "true").lower() == "true"
SANITIZE = os.getenv("OPENDATALOADER_SANITIZE", "false").lower() == "true"
CONTENT_SAFETY = os.getenv("OPENDATALOADER_CONTENT_SAFETY", "true").lower() == "true"


class OpenDataLoaderEngine(ParserEngine):
    name = "opendataloader"

    def _convert_to_markdown(self, input_path: str, output_dir: str) -> str:
        """Run opendataloader-pdf convert and read the markdown output."""
        from opendataloader_pdf import convert

        convert(
            input_path,
            output_dir=output_dir,
            format="markdown",
            use_struct_tree=USE_STRUCT_TREE,
            reading_order=READING_ORDER,
            table_method=TABLE_METHOD,
            include_header_footer=INCLUDE_HEADER_FOOTER,
            keep_line_breaks=KEEP_LINE_BREAKS,
            sanitize=SANITIZE,
            content_safety=CONTENT_SAFETY,
        )

        # opendataloader writes output as <stem>.md in output_dir
        stem = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{stem}.md")

        if not os.path.exists(output_path):
            # Fallback: find any .md file in output_dir
            md_files = [f for f in os.listdir(output_dir) if f.endswith(".md")]
            if not md_files:
                raise RuntimeError(f"No markdown output found in {output_dir}")
            output_path = os.path.join(output_dir, md_files[0])

        with open(output_path, "r", encoding="utf-8") as f:
            return f.read()

    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            return ParseResult(**cached)

        logger.info(f"Parsing {file_name} with OpenDataLoader (local mode)")

        with tempfile.TemporaryDirectory(prefix="opendataloader_") as tmpdir:
            input_path = os.path.join(tmpdir, file_name or "document.pdf")
            with open(input_path, "wb") as f:
                f.write(file_bytes)

            output_dir = os.path.join(tmpdir, "output")
            os.makedirs(output_dir)

            markdown_content = self._convert_to_markdown(input_path, output_dir)

        parse_result = ParseResult(
            markdown_content=markdown_content,
            token_count=len(markdown_content.split()),
        )
        set_cached_result(file_hash, {
            "markdown_content": parse_result.markdown_content,
            "token_count": parse_result.token_count,
        }, self.name)
        return parse_result

    def parse_url(self, url: str) -> ParseResult:
        import requests

        logger.info(f"Downloading {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return self.parse_bytes(response.content, url.split("/")[-1])
```

- [ ] **Step 2: Update engines `__init__.py`**

Add the new engine to `workers/parser-service/src/engines/__init__.py`:

```python
from .markitdown_engine import MarkItDownEngine
from .docling_engine import DoclingEngine
from .pymupdf_engine import PyMuPdfEngine
from .opendataloader_engine import OpenDataLoaderEngine

__all__ = ["MarkItDownEngine", "DoclingEngine", "PyMuPdfEngine", "OpenDataLoaderEngine"]
```

- [ ] **Step 3: Commit**

```bash
git add workers/parser-service/src/engines/opendataloader_engine.py workers/parser-service/src/engines/__init__.py
git commit -m "feat: add OpenDataLoaderEngine parser plugin

Local mode only — 20+ pages/sec on CPU, no GPU needed.
Writes to temp files, reads markdown output, cleans up.
Configurable via OPENDATALOADER_* env vars."
```

---

### Task 5: Docker + Dependencies

Add the JRE and Python package to the parser-service build.

**Files:**
- Modify: `workers/parser-service/requirements.txt`
- Modify: `workers/parser-service/Dockerfile`

- [ ] **Step 1: Add opendataloader-pdf to requirements.txt**

Append to the end of `workers/parser-service/requirements.txt`:

```
opendataloader-pdf
```

- [ ] **Step 2: Add JRE to Dockerfile runtime stage**

In `workers/parser-service/Dockerfile`, update the runtime stage `apt-get install` block (lines 28-31) to include `openjdk-17-jre-headless`:

```dockerfile
# Only runtime system libs — no build-essential, no tesseract
RUN apt-get update && apt-get install -y \
    curl \
    libgl1 \
    libglib2.0-0 \
    openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*
```

- [ ] **Step 3: Commit**

```bash
git add workers/parser-service/requirements.txt workers/parser-service/Dockerfile
git commit -m "build: add opendataloader-pdf dep and JRE to parser-service

opendataloader-pdf Python SDK added to requirements.
JRE 17 headless added to Docker runtime stage (~200-300MB)."
```

---

### Task 6: NestJS Extractor Entity + DTO

Add `parserEngine` column to the Extractor entity and expose it in DTOs.

**Files:**
- Modify: `server/src/extractors/entities/extractor.entity.ts`
- Modify: `server/src/extractors/dto/create-extractor.dto.ts`

- [ ] **Step 1: Add `parserEngine` column to Extractor entity**

In `server/src/extractors/entities/extractor.entity.ts`, add the following after the `conflictResolution` column (after line 97):

```typescript
  @ApiPropertyOptional({
    enum: ['docling', 'markitdown', 'pymupdf', 'opendataloader'],
    default: 'docling',
    description: 'Parser engine used for document parsing',
  })
  @Column({
    type: 'enum',
    enum: ['docling', 'markitdown', 'pymupdf', 'opendataloader'],
    default: 'docling',
  })
  parserEngine: 'docling' | 'markitdown' | 'pymupdf' | 'opendataloader';
```

- [ ] **Step 2: Add `parserEngine` to CreateExtractorDto**

In `server/src/extractors/dto/create-extractor.dto.ts`, add the following after the `conflictResolution` field (after line 127):

```typescript
  @ApiPropertyOptional({
    enum: ['docling', 'markitdown', 'pymupdf', 'opendataloader'],
    default: 'docling',
    description: 'Parser engine used for document parsing',
  })
  @IsEnum(['docling', 'markitdown', 'pymupdf', 'opendataloader'])
  @IsOptional()
  parserEngine?: 'docling' | 'markitdown' | 'pymupdf' | 'opendataloader';
```

Note: `UpdateExtractorDto` uses `PartialType(CreateExtractorDto)` so it inherits this field automatically.

- [ ] **Step 3: Commit**

```bash
git add server/src/extractors/entities/extractor.entity.ts server/src/extractors/dto/create-extractor.dto.ts
git commit -m "feat: add parserEngine column to Extractor entity

Per-extractor engine selection: docling (default), markitdown, pymupdf, opendataloader.
TypeORM synchronize will auto-create the column on restart."
```

---

### Task 7: RunsService Job Payload

Include `parser_engine` from the extractor in the BullMQ job payload sent to the parser-service.

**Files:**
- Modify: `server/src/runs/runs.service.ts`

- [ ] **Step 1: Add `parser_engine` to job payload**

In `server/src/runs/runs.service.ts`, find the `addJob` call at line 285-296:

```typescript
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
        },
      );
```

Add `parser_engine: extractor.parserEngine,` to the payload object:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add server/src/runs/runs.service.ts
git commit -m "feat: pass parser_engine in BullMQ job payload

RunsService reads parserEngine from the Extractor entity
and includes it in the uploaded-documents job data."
```

---

### Task 8: Frontend — Parser Engine Dropdown

Add a "Parser Engine" dropdown to the extractor configuration form.

**Files:**
- Modify: `client/src/types/extractor.ts`
- Modify: `client/src/components/extractors/ExtractionSettings.tsx`

- [ ] **Step 1: Add `parserEngine` to ExtractorFormData type**

In `client/src/types/extractor.ts`, add to the `ExtractorFormData` interface (after the `defaultModel: string;` line):

```typescript
  // Parser Engine
  parserEngine: "docling" | "markitdown" | "pymupdf" | "opendataloader";
```

Add to `defaultExtractorFormValues` (after the `defaultModel` line):

```typescript
  parserEngine: "docling",
```

- [ ] **Step 2: Add Parser Engine dropdown to ExtractionSettings**

In `client/src/components/extractors/ExtractionSettings.tsx`, add a new "Parser Engine" section **before** the Consensus Voting section (before the first `<div className="bg-surface-light` at line 14). Insert the following JSX inside the outer `<div className="flex flex-col gap-6">`:

```tsx
            {/* Parser Engine */}
            <div className="bg-surface-light xdark:bg-surface-dark border-2 border-border-light xdark:border-border-dark rounded-xl p-6 shadow-sm">
                {showHeader && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/20 rounded-lg text-text-main xdark:text-primary">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-main xdark:text-white leading-tight">
                                Parser Engine
                            </h2>
                            <p className="text-xs text-text-sub xdark:text-gray-400">
                                Choose how documents are converted to text before extraction.
                            </p>
                        </div>
                    </div>
                )}
                {!showHeader && (
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-main xdark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                            Parser Engine
                        </h3>
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-main xdark:text-gray-300">
                        Engine
                    </label>
                    <Controller
                        name="parserEngine"
                        control={control}
                        render={({ field }) => (
                            <select
                                className="inset-input w-full appearance-none bg-[#f3f4f6] xdark:bg-[#1a190e] border border-border-light xdark:border-border-dark rounded-lg px-4 py-3 text-text-main xdark:text-white font-medium text-sm focus:border-primary focus:ring-0"
                                {...field}
                            >
                                <option value="docling">Docling (AI-Powered, Best Accuracy)</option>
                                <option value="opendataloader">OpenDataLoader (Fast, 20+ pages/sec)</option>
                                <option value="markitdown">MarkItDown (Lightweight, Multi-Format)</option>
                                <option value="pymupdf">PyMuPDF (Basic Text Extraction)</option>
                            </select>
                        )}
                    />
                    <p className="text-[11px] text-text-sub flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">info</span>
                        Docling is slower but most accurate. OpenDataLoader is fastest for simple PDFs.
                    </p>
                </div>
            </div>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/extractor.ts client/src/components/extractors/ExtractionSettings.tsx
git commit -m "feat: parser engine dropdown in extractor settings UI

Users can now select parser engine per extractor:
Docling (default), OpenDataLoader, MarkItDown, PyMuPDF."
```

---

### Task 9: Regenerate API Client

Run Orval to regenerate the typed API hooks/models so the frontend picks up the new `parserEngine` field from Swagger.

**Files:**
- Regenerated: `client/src/api/endpoints/`, `client/src/api/models/`, `client/src/api/schemas/`

- [ ] **Step 1: Restart the NestJS server so Swagger spec updates**

```bash
# Ensure the NestJS server is running with the new entity/DTO changes
cd server && pnpm run build
```

- [ ] **Step 2: Regenerate the API client**

```bash
cd client && pnpm run gen:api
```

Expected: Orval regenerates files in `src/api/`. The `Extractor` model and Zod schemas should now include `parserEngine`.

- [ ] **Step 3: Verify the generated types include parserEngine**

```bash
grep -r "parserEngine" client/src/api/
```

Expected: Multiple matches in models, schemas, and endpoint files showing the `parserEngine` field.

- [ ] **Step 4: Commit**

```bash
git add client/src/api/
git commit -m "chore: regenerate API client with parserEngine field"
```

---

### Task 10: Integration Test — End-to-End Smoke Test

Verify the full pipeline works with the new engine by building and running Docker.

- [ ] **Step 1: Build and start all services**

```bash
docker-compose up -d --build
```

Expected: All services start successfully. Parser-service logs should show no import errors for opendataloader_pdf.

- [ ] **Step 2: Verify parser-service starts without errors**

```bash
docker-compose logs parser-service | head -30
```

Expected: No import errors. Should see the engine initialization logs.

- [ ] **Step 3: Manual test via UI**

1. Open http://localhost:5174
2. Create or edit an extractor
3. In Extraction Settings, select "OpenDataLoader (Fast, 20+ pages/sec)" from the Parser Engine dropdown
4. Save the extractor
5. Upload a PDF and run extraction
6. Verify the run completes successfully with markdown output

- [ ] **Step 4: Verify engine routing in logs**

```bash
docker-compose logs parser-service | grep "engine"
```

Expected: Should show `Parser engine initialized: opendataloader` and `Parsing <filename> with OpenDataLoader (local mode)`.

- [ ] **Step 5: Commit any fixes discovered during testing**

```bash
git add -A
git commit -m "fix: integration test fixes for opendataloader engine"
```

Only commit this if fixes were needed. Skip if everything worked on first try.
