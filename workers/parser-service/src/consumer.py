import asyncio
import gc
import io
import logging
import os
import time
from datetime import datetime, timezone
from .bullmq_client import bullmq_client
from .parser_engine import get_engine
from bullmq import Job
import boto3

logger = logging.getLogger(__name__)

QUEUE_UPLOADED = "uploaded-documents"
QUEUE_PARSED = "parsed-documents"
PARSER_CONCURRENCY = int(os.getenv("PARSER_CONCURRENCY", "2"))
IDLE_SHUTDOWN_SECONDS = int(os.getenv("IDLE_SHUTDOWN_MINUTES", "15")) * 60

_last_activity: float = time.monotonic()

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "docxtractor-documents")

s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
)


def _make_log(level, message):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": message,
        "source": "parser",
    }


async def process_job(job: Job, token: str = None):
    """
    Process a single job from BullMQ.
    """
    global _last_activity
    _last_activity = time.monotonic()

    data = job.data
    logs = []
    doc_name = data.get("name", "unknown")
    run_id = data.get("run_id")
    engine_name = data.get("parser_engine")
    engine = get_engine(engine_name)

    try:
        # Check if run was cancelled/retried before we start expensive work
        if run_id and await bullmq_client.is_run_cancelled(run_id):
            logger.info(f"⏭️ Skipping job {job.id} — run {run_id} was cancelled/retried")
            return {"status": "skipped", "reason": "run_cancelled"}

        logger.info(f"📥 Received job {job.id} for run: {run_id} doc: {data.get('document_id')} (engine={engine.name})")

        doc_type = data.get("type", "file")
        logger.info(f"Document type: {doc_type}")

        # Handle different document types
        if doc_type == "url":
            url = data.get("url")
            logger.info(f"Processing URL document: {url}")
            if not url:
                logger.error("❌ No URL provided for URL type document")
                logs.append(_make_log("error", f"No URL provided for '{doc_name}'"))
                event = {
                    "run_id": data.get("run_id"),
                    "document_id": data.get("document_id"),
                    "retry_generation": data.get("retry_generation", 0),
                    "status": "failed",
                    "error": "No URL provided",
                    "logs": logs,
                }
                await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
                return {"status": "error", "message": "No URL provided"}

            # Process URL document
            logs.append(_make_log("info", f"Downloading URL: {url}"))
            logger.info(f"🌐 Downloading and processing URL: {url}")
            result = await asyncio.to_thread(engine.parse_url, url)
            logger.info(f"✅ URL document processed successfully")
        else:
            # Handle file type (default)
            file_key = data.get("file_key") or data.get("file_url", "").replace("s3://docxtractor-documents/", "")
            logger.info(f"Processing file document: {file_key}")

            if not file_key:
                logger.error("❌ No file_key found in event")
                logs.append(_make_log("error", f"No file key found for '{doc_name}'"))
                event = {
                    "run_id": data.get("run_id"),
                    "document_id": data.get("document_id"),
                    "retry_generation": data.get("retry_generation", 0),
                    "status": "failed",
                    "error": "No file_key found",
                    "logs": logs,
                }
                await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
                return {"status": "error", "message": "No file_key found"}

            # Download from MinIO and parse
            logs.append(_make_log("info", f"Downloading file '{doc_name}' from storage"))
            logger.info(f"📄 Processing file from MinIO: {file_key}")

            file_stream = io.BytesIO()
            s3_client.download_fileobj(MINIO_BUCKET, file_key, file_stream)
            file_stream.seek(0)
            file_bytes = file_stream.read()
            file_stream.close()
            del file_stream

            result = await asyncio.to_thread(engine.parse_bytes, file_bytes, doc_name)
            del file_bytes
            logger.info(f"✅ File document processed successfully")

        # Check again after processing — run may have been cancelled while we were working
        if run_id and await bullmq_client.is_run_cancelled(run_id):
            logger.info(f"⏭️ Discarding result for job {job.id} — run {run_id} was cancelled/retried during processing")
            return {"status": "skipped", "reason": "run_cancelled"}

        logs.append(_make_log("info", "File downloaded, starting document parsing"))
        logs.append(_make_log("info", f"Document parsed to markdown ({result.token_count:,} tokens, {len(result.markdown_content):,} chars)"))

        # Produce Result
        event = {
            "run_id": data.get("run_id"),
            "document_id": data.get("document_id"),
            "retry_generation": data.get("retry_generation", 0),
            "status": "success",
            "markdown_content": result.markdown_content,
            "token_count": result.token_count,
            "logs": logs,
        }
        del result

        logger.info(f"📤 Sending parsed result to queue: {QUEUE_PARSED}")
        await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
        del event
        logger.info(f"✅ Processed and produced result for {data.get('document_id')}")
        gc.collect()
        return {"status": "success"}

    except Exception as e:
        logger.error(f"❌ Error processing job {job.id}: {e}", exc_info=True)
        logs.append(_make_log("error", f"Parsing failed for '{doc_name}': {e}"))
        # Produce failure event
        event = {
            "run_id": data.get("run_id"),
            "document_id": data.get("document_id"),
            "retry_generation": data.get("retry_generation", 0),
            "status": "failed",
            "error": str(e),
            "logs": logs,
        }
        logger.info(f"📤 Sending failure event to queue: {QUEUE_PARSED}")
        await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
        gc.collect()
        raise e

async def _idle_watcher():
    if IDLE_SHUTDOWN_SECONDS <= 0:
        return
    from .parser_engine import unload_engines
    logger.info(f"Idle unload enabled: will release models after {IDLE_SHUTDOWN_SECONDS // 60} min of inactivity")
    unloaded = False
    while True:
        await asyncio.sleep(60)
        idle = time.monotonic() - _last_activity
        if idle >= IDLE_SHUTDOWN_SECONDS and not unloaded:
            logger.info(f"No jobs for {idle / 60:.1f} min — unloading parser models to free RAM")
            await asyncio.to_thread(unload_engines)
            unloaded = True
        elif idle < IDLE_SHUTDOWN_SECONDS and unloaded:
            # Job arrived after unload — reset flag so we unload again next idle period
            unloaded = False


async def consume():
    """
    Main entry point for starting the worker.
    """
    logger.info(f"Starting BullMQ worker for queue {QUEUE_UPLOADED} (concurrency={PARSER_CONCURRENCY})")
    worker = bullmq_client.create_worker(QUEUE_UPLOADED, process_job, concurrency=PARSER_CONCURRENCY)
    idle_task = asyncio.create_task(_idle_watcher())
    try:
        # Keep the coroutine alive while the worker runs
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Worker cancelled")
    finally:
        idle_task.cancel()
        await worker.close()
