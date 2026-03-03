# Microservices Implementation Plan

## Goal Description

Implement two specialized Python microservices to handle document processing:

1.  **parser-service**: Responsible for converting raw documents (PDF/DOCX) into structured Markdown using **Docling**.
2.  **extraction-service**: Responsible for extracting structured data from the parsed content using **LangExtract** (Google Gemini).

They will communicate via **BullMQ** (Redis-backed queues).

## System Architecture

### Components

1.  **Core Backend (NestJS)**: Orchestrates the job.
    - **Splits** multi-doc jobs into individual parsing requests.
    - **Aggregates** parsed results.
    - **Triggers** extraction once all docs are ready (if "Unified" mode).
2.  **BullMQ (Redis)**: managing queues:
    - `uploaded-documents`: Document ready for parsing.
    - `parsed-documents`: Document parsed, result returned to backend.
    - `extraction-requests`: Backend requests extraction (single or multi-doc).
    - `extraction-completed`: Extraction done.
3.  **parser-service**:
    - Input: `uploaded-documents`
    - Action: Download file -> Run `docling`
    - Output: `parsed-documents` (Markdown content)
4.  **extraction-service**:
    - Input: `extraction-requests`
    - Action: Run `langextract` with provided **Schema** & **Examples**.
    - Output: `extraction-completed` (JSON Data)
5.  **MinIO (Local S3)**: Shared storage for all files.
    - Acts as a drop-in replacement for AWS S3.
    - Services use standard AWS SDKs to read/write files.

### System Design Principles (The "Fast-Moving Startup" Approach)

- **MinIO for Storage**: We use MinIO to simulate S3. This keeps our code "cloud-native" (using S3 SDKs) so we can switch to real S3 later by just changing environment variables.
- **Pragmatic Decoupling**: Services do one thing well. Backend coordinates.
- **Schema-First**: The Backend owns the schema (Zod/JSON) and passes it to the worker. Workers are dumb; they just execute the schema.
- **Unified Context**: For multi-doc jobs, we combine markdowns into one context window for the LLM.

### Service Contracts (Jobs)

#### 1. Queue: `uploaded-documents` (Backend -> Parser)

**Job: `parse-document`**

```json
{
  "run_id": "job-123",
  "document_id": "doc-456",
  "file_url": "s3://...",
  "mime_type": "application/pdf"
}
```

#### 2. Queue: `parsed-documents` (Parser -> Backend)

**Job: `document-parsed`**

```json
{
  "run_id": "job-123",
  "document_id": "doc-456",
  "status": "success",
  "markdown_content": "# Page 1...",
  "token_count": 500
}
```

#### 3. Queue: `extraction-requests` (Backend -> Extractor)

**Job: `extract-data`**
This payload contains EVERYTHING needed for extraction: the content and the rules.

```json
{
  "run_id": "job-123",
  "mode": "unified",
  "content": {
    "combined_markdown": "source: doc1\n...\nsource: doc2\n..."
  },
  "schema": {
    "fields": [
      {
        "name": "invoice_total",
        "type": "number",
        "description": "Total amount including tax",
        "validation": { "min": 0 }
      }
    ],
    "examples": [{ "input": "Total: $500", "output": { "invoice_total": 500 } }]
  }
}
```

#### 4. Queue: `extraction-completed` (Extractor -> Backend)

**Job: `extraction-completed`**

```json
{
  "run_id": "job-123",
  "status": "success",
  "data": { "invoice_total": 500.0 },
  "usage": { "total_tokens": 1500 }
}
```

## Proposed Changes

### 1. New Folder Structure

#### `workers/parser-service/`

```text
docXtractor/workers/parser-service/
├── Dockerfile
├── requirements.txt (docling, bullmq)
├── src/
│   ├── main.py
│   ├── consumer.py
│   ├── bullmq_client.py
│   └── docling_processor.py
```

#### `workers/extraction-service/`

```text
docXtractor/workers/extraction-service/
├── Dockerfile
├── requirements.txt (langextract, bullmq)
├── src/
│   ├── main.py
│   ├── consumer.py
│   ├── bullmq_client.py
│   └── extractor.py
```

### 2. Infrastructure: [docker-compose.yml](file:///Users/cefalo/Pets/docXtractor/docker-compose.yml)

- **Redis**: Message broker and cache.
- **MinIO**: S3-compatible storage.
- **parser-service**: Python worker.
- **extraction-service**: Python worker.

### 3. Core Backend (`server` directory)

The backend uses **@nestjs/bullmq** to manage job queues and communicate with workers.

## Verification Plan

1.  **Manual**: Trigger a run -> Check worker logs -> Verify database results.
