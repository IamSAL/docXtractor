import asyncio
import logging
from .bullmq_client import bullmq_client
from .extractor import run_extraction
from bullmq import Job

logger = logging.getLogger(__name__)

QUEUE_REQUESTS = "extraction-requests"
QUEUE_COMPLETED = "extraction-completed"

async def process_job(job: Job, token: str = None):
    """
    Process an extraction job from BullMQ.
    """
    data = job.data
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
        
        logger.info(f"Extraction parameters:")
        logger.info(f"  - Type: {extraction_type}")
        logger.info(f"  - Model: {model_id}")
        logger.info(f"  - System prompt length: {len(system_prompt)}")
        logger.info(f"  - Content length: {len(markdown_text)}")
        logger.info(f"  - Schema fields: {len(schema.get('fields', []))}")
        logger.info(f"  - Examples: {len(examples)}")
        
        if not markdown_text:
            logger.warning("❌ No markdown content provided")
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
        
        # Produce Result
        event = {
            "run_id": data.get("run_id"),
            "status": "success",
            "result": result["data"],
            "usage": result["usage"]
        }
        
        logger.info(f"📤 Sending extraction result to queue: {QUEUE_COMPLETED}")
        logger.info(f"Result usage: {result['usage']}")
        await bullmq_client.add_job(QUEUE_COMPLETED, "extraction-completed", event)
        logger.info(f"✅ Completed extraction for {data.get('run_id')}")
        return {"status": "success"}

    except Exception as e:
        logger.error(f"❌ Error extracting in job {job.id}: {e}", exc_info=True)
        event = {
            "run_id": data.get("run_id"),
            "status": "failed",
            "error": str(e)
        }
        logger.info(f"📤 Sending failure event to queue: {QUEUE_COMPLETED}")
        await bullmq_client.add_job(QUEUE_COMPLETED, "extraction-completed", event)
        raise e

async def consume():
    """
    Main entry point for starting the worker.
    """
    logger.info(f"Starting BullMQ worker for queue {QUEUE_REQUESTS}")
    worker = bullmq_client.create_worker(QUEUE_REQUESTS, process_job)
    
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Worker cancelled")
    finally:
        await worker.close()
