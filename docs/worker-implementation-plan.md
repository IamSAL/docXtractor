# Microservices Implementation Plan

## Goal Description
Implement two specialized Python microservices to handle document processing:
1.  **parser-service**: Responsible for converting raw documents (PDF/DOCX) into structured Markdown using **Docling**.
2.  **extraction-service**: Responsible for extracting structured data from the parsed content using **LangExtract** (Google Gemini).

They will communicate via **Kafka (KRaft mode)**.

## System Architecture

### Components
1.  **Core Backend (NestJS)**: Orchestrates the job.
    *   **Splits** multi-doc jobs into individual parsing requests.
    *   **Aggregates** parsed results.
    *   **Triggers** extraction once all docs are ready (if "Unified" mode).
2.  **Kafka (KRaft)**: managing topics:
    *   `docxtractor.documents.uploaded`: Document ready for parsing.
    *   `docxtractor.documents.parsed`: Document parsed, result returned to backend.
    *   `docxtractor.extraction.requests`: Backend requests extraction (single or multi-doc).
    *   `docxtractor.extraction.completed`: Extraction done.
3.  **parser-service**:
    *   Input: `docxtractor.documents.uploaded`
    *   Action: Download file -> Run `docling`
    *   Output: `docxtractor.documents.parsed` (Markdown content)
4.  **extraction-service**:
    *   Input: `docxtractor.extraction.requests`
    *   Action: Run `langextract` with provided **Schema** & **Examples**.
    *   Output: `docxtractor.extraction.completed` (JSON Data)
5.  **MinIO (Local S3)**: Shared storage for all files.
    *   Acts as a drop-in replacement for AWS S3.
    *   Services use standard AWS SDKs to read/write files.

### System Design Principles (The "Fast-Moving Startup" Approach)
*   **MinIO for Storage**: We use MinIO to simulate S3. This keeps our code "cloud-native" (using S3 SDKs) so we can switch to real S3 later by just changing environment variables.
*   **Pragmatic Decoupling**: Services do one thing well. Backend coordinates.
*   **Schema-First**: The Backend owns the schema (Zod/JSON) and passes it to the worker. Workers are dumb; they just execute the schema.
*   **Unified Context**: For multi-doc jobs, we combine markdowns into one context window for the LLM.

### Service Contracts (DTOs)

#### 1. Topic: `docxtractor.documents.uploaded` (Backend -> Parser)
**Event: `DocumentUploadedEvent`**
```json
{
  "job_id": "job-123",
  "document_id": "doc-456",
  "file_url": "s3://...",
  "mime_type": "application/pdf"
}
```

#### 2. Topic: `docxtractor.documents.parsed` (Parser -> Backend)
**Event: `DocumentParsedEvent`**
```json
{
  "job_id": "job-123",
  "document_id": "doc-456",
  "status": "success",
  "markdown_content": "# Page 1...",
  "token_count": 500
}
```

#### 3. Topic: `docxtractor.extraction.requests` (Backend -> Extractor)
**Event: `ExtractionRequestEvent`**
This payload contains EVERYTHING needed for extraction: the content and the rules.

```json
{
  "job_id": "job-123",
  "mode": "unified", // or "per_document"
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
    "examples": [
      { "input": "Total: $500", "output": { "invoice_total": 500 } }
    ]
  }
}
```

#### 4. Topic: `docxtractor.extraction.completed` (Extractor -> Backend)
**Event: `ExtractionCompletedEvent`**
```json
{
  "job_id": "job-123",
  "status": "success",
  "data": { "invoice_total": 500.00 },
  "usage": { "total_tokens": 1500 }
}
```

## Proposed Changes

### 1. New Folder Structure

We will create two separate directories under `workers/`.

#### `workers/parser-service/`
```text
docXtractor/workers/parser-service/
├── Dockerfile
├── requirements.txt (docling, aiokafka)
├── src/
│   ├── main.py
│   ├── consumer.py
│   └── docling_processor.py
```

#### `workers/extraction-service/`
```text
docXtractor/workers/extraction-service/
├── Dockerfile
├── requirements.txt (langextract, aiokafka)
├── src/
│   ├── main.py
│   ├── consumer.py
│   └── extractor.py
```

### 2. Infrastructure: [docker-compose.yml](file:///Users/salman/Pets/docXtractor/docker-compose.yml)
- **Kafka (KRaft)**: Message broker.
- **MinIO**: S3-compatible storage.
  - Port: `9000` (API), `9001` (Console)
  - Volume: `./minio_data:/data`
- **createbuckets**: A tiny ephemeral container to run `mc mb local/docxtractor` on startup.
- **parser-service**: Python worker.
- **extraction-service**: Python worker.

### 3. Core Backend (`server` directory)
> **Note**: The current `server` directory should be treated as a **template repository**. We will incrementally add new DocXTractor features (like the Kafka producer/consumer logic, Job entities) into this existing structure. The existing template code will be refactored or removed as we replace it with our specific business logic.

## Verification Plan
1.  **Manual**: Upload file to MinIO Console -> Push JSON to `uploaded` -> Check Parser Log.
