import asyncio
import logging
from .bullmq_client import bullmq_client
from .docling_processor import process_document
from bullmq import Job

logger = logging.getLogger(__name__)

QUEUE_UPLOADED = "uploaded-documents"
QUEUE_PARSED = "parsed-documents"

async def process_job(job: Job):
    """
    Process a single job from BullMQ.
    """
    data = job.data
    try:
        logger.info(f"Received job {job.id} for run: {data.get('run_id')} doc: {data.get('document_id')}")
        
        file_key = data.get("file_key") or data.get("file_url", "").replace("s3://docxtractor-documents/", "")
        
        if not file_key:
            logger.error("No file_key found in event")
            return {"status": "error", "message": "No file_key found"}

        # 2. Process (Blocking Call run in ThreadPool)
        result = await asyncio.to_thread(
            process_document, 
            data.get("document_id"), 
            file_key
        )
        
        # 3. Produce Result
        event = {
            "run_id": data.get("run_id"),
            "document_id": data.get("document_id"),
            "status": "success",
            "markdown_content": result["markdown_content"],
            "token_count": result["token_count"]
        }
        
        await bullmq_client.add_job(QUEUE_PARSED, "document-parsed", event)
        logger.info(f"Processed and produced result for {data.get('document_id')}")
        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error processing job {job.id}: {e}")
        # Produce failure event
        event = {
            "run_id": data.get("run_id"),
            "document_id": data.get("document_id"),
            "status": "failed",
            "error": str(e)
        }
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
