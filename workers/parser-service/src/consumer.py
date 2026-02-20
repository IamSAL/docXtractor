import asyncio
import logging
from .bullmq_client import bullmq_client
from .docling_processor import process_document
from bullmq import Job

logger = logging.getLogger(__name__)

QUEUE_UPLOADED = "uploaded-documents"
QUEUE_PARSED = "parsed-documents"

async def process_job(job: Job, token: str = None):
    """
    Process a single job from BullMQ.
    """
    data = job.data
    try:
        logger.info(f"📥 Received job {job.id} for run: {data.get('run_id')} doc: {data.get('document_id')}")
        logger.info(f"Job data: {data}")
        
        doc_type = data.get("type", "file")
        logger.info(f"Document type: {doc_type}")
        
        # Handle different document types
        if doc_type == "url":
            url = data.get("url")
            logger.info(f"Processing URL document: {url}")
            if not url:
                logger.error("❌ No URL provided for URL type document")
                event = {
                    "run_id": data.get("run_id"),
                    "document_id": data.get("document_id"),
                    "status": "failed",
                    "error": "No URL provided"
                }
                await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
                return {"status": "error", "message": "No URL provided"}
            
            # Process URL document
            logger.info(f"🌐 Downloading and processing URL: {url}")
            from .url_processor import process_url_document
            result = await asyncio.to_thread(
                process_url_document,
                data.get("document_id"),
                url
            )
            logger.info(f"✅ URL document processed successfully")
        else:
            # Handle file type (default)
            file_key = data.get("file_key") or data.get("file_url", "").replace("s3://docxtractor-documents/", "")
            logger.info(f"Processing file document: {file_key}")
            
            if not file_key:
                logger.error("❌ No file_key found in event")
                event = {
                    "run_id": data.get("run_id"),
                    "document_id": data.get("document_id"),
                    "status": "failed",
                    "error": "No file_key found"
                }
                await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
                return {"status": "error", "message": "No file_key found"}

            # Process file document
            logger.info(f"📄 Processing file from MinIO: {file_key}")
            result = await asyncio.to_thread(
                process_document, 
                data.get("document_id"), 
                file_key
            )
            logger.info(f"✅ File document processed successfully")
        
        # Produce Result
        event = {
            "run_id": data.get("run_id"),
            "document_id": data.get("document_id"),
            "status": "success",
            "markdown_content": result["markdown_content"],
            "token_count": result["token_count"]
        }
        
        logger.info(f"📤 Sending parsed result to queue: {QUEUE_PARSED}")
        logger.info(f"Result: status=success, tokens={result['token_count']}, content_length={len(result['markdown_content'])}")
        await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
        logger.info(f"✅ Processed and produced result for {data.get('document_id')}")
        return {"status": "success"}

    except Exception as e:
        logger.error(f"❌ Error processing job {job.id}: {e}", exc_info=True)
        # Produce failure event
        event = {
            "run_id": data.get("run_id"),
            "document_id": data.get("document_id"),
            "status": "failed",
            "error": str(e)
        }
        logger.info(f"📤 Sending failure event to queue: {QUEUE_PARSED}")
        await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
        raise e

async def consume():
    """
    Main entry point for starting the worker.
    """
    logger.info(f"Starting BullMQ worker for queue {QUEUE_UPLOADED}")
    worker = bullmq_client.create_worker(QUEUE_UPLOADED, process_job)
    try:
        # Keep the coroutine alive while the worker runs
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Worker cancelled")
    finally:
        await worker.close()
