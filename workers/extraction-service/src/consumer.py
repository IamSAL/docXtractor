import asyncio
import logging
import os
from datetime import datetime, timezone
from .bullmq_client import bullmq_client
from .extractor import run_extraction
from bullmq import Job

logger = logging.getLogger(__name__)

QUEUE_REQUESTS = "extraction-requests"
QUEUE_COMPLETED = "extraction-completed"
EXTRACTION_CONCURRENCY = int(os.getenv("EXTRACTION_CONCURRENCY", "3"))


def _make_log(level, message):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": message,
        "source": "extractor",
    }


async def process_job(job: Job, token: str = None):
    """
    Process an extraction job from BullMQ.
    """
    data = job.data
    logs = []
    document_id = data.get("document_id")  # Present in batch/per_document mode
    source_name = data.get("source_name")  # Present in batch/per_document mode
    try:
        logger.info(f"📥 Received extraction request job {job.id} for run: {data.get('run_id')}")
        logger.info(f"Job data keys: {list(data.keys())}")

        content_block = data.get("content", {})
        markdown_text = content_block.get("combined_markdown") or content_block.get("markdown", "")
        schema = data.get("schema", {})
        system_prompt = data.get("system_prompt", "")
        extraction_type = data.get("extraction_type", "llm")
        examples = data.get("examples", [])
        model_id = data.get("model_id", "gemini-2.0-flash-exp")

        schema_fields = len(schema.get("fields", []))

        logger.info(f"Extraction parameters:")
        logger.info(f"  - Type: {extraction_type}")
        logger.info(f"  - Model: {model_id}")
        logger.info(f"  - System prompt length: {len(system_prompt)}")
        logger.info(f"  - Content length: {len(markdown_text)}")
        logger.info(f"  - Schema fields: {schema_fields}")
        logger.info(f"  - Examples: {len(examples)}")

        logs.append(_make_log("info", f"Starting {extraction_type} extraction with model {model_id}"))
        logs.append(_make_log("info", f"Content length: {len(markdown_text)} chars, Schema fields: {schema_fields}"))

        if not markdown_text:
            logger.warning("❌ No markdown content provided")
            logs.append(_make_log("error", "No markdown content provided"))
            event = {
                "run_id": data.get("run_id"),
                "document_id": document_id,
                "source_name": source_name,
                "status": "failed",
                "error": "No markdown content",
                "logs": logs,
            }
            await bullmq_client.add_job(QUEUE_COMPLETED, "extraction-completed", event)
            return {"status": "error", "message": "No markdown content"}

        # Run Extraction (Blocking IO -> Thread)
        logger.info(f"🔄 Starting extraction with {extraction_type}...")
        result = await asyncio.to_thread(
            run_extraction,
            markdown_text,
            schema,
            system_prompt=system_prompt,
            model_id=model_id,
            extraction_type=extraction_type,
            examples=examples
        )
        logger.info(f"✅ Extraction completed successfully")
        logs.append(_make_log("info", "Extraction completed, processing results"))

        # Produce Result
        event = {
            "run_id": data.get("run_id"),
            "document_id": document_id,
            "source_name": source_name,
            "status": "success",
            "result": result["data"],
            "usage": result["usage"],
            "logs": logs,
        }

        logger.info(f"📤 Sending extraction result to queue: {QUEUE_COMPLETED}")
        logger.info(f"Result usage: {result['usage']}")
        await bullmq_client.add_job(QUEUE_COMPLETED, "extraction-completed", event)
        logger.info(f"✅ Completed extraction for {data.get('run_id')}")
        return {"status": "success"}

    except Exception as e:
        logger.error(f"❌ Error extracting in job {job.id}: {e}", exc_info=True)
        logs.append(_make_log("error", f"Extraction failed: {e}"))
        event = {
            "run_id": data.get("run_id"),
            "document_id": document_id,
            "source_name": source_name,
            "status": "failed",
            "error": str(e),
            "logs": logs,
        }
        logger.info(f"📤 Sending failure event to queue: {QUEUE_COMPLETED}")
        await bullmq_client.add_job(QUEUE_COMPLETED, "extraction-completed", event)
        raise e

async def consume():
    """
    Main entry point for starting the worker.
    """
    logger.info(f"Starting BullMQ worker for queue {QUEUE_REQUESTS} (concurrency={EXTRACTION_CONCURRENCY})")
    worker = bullmq_client.create_worker(QUEUE_REQUESTS, process_job, concurrency=EXTRACTION_CONCURRENCY)

    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Worker cancelled")
    finally:
        await worker.close()
