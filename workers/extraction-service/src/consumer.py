import asyncio
import logging
from .kafka_client import kafka_client
from .extractor import run_extraction

logger = logging.getLogger(__name__)

TOPIC_REQUESTS = "docxtractor.extraction.requests"
TOPIC_COMPLETED = "docxtractor.extraction.completed"
CONSUMER_GROUP = "extractor-group"

async def consume():
    await kafka_client.start_producer()
    consumer = kafka_client.get_consumer(TOPIC_REQUESTS, CONSUMER_GROUP)
    await consumer.start()
    logger.info(f"Started consumer for {TOPIC_REQUESTS}")
    
    try:
        async for msg in consumer:
            try:
                data = msg.value
                logger.info(f"Received extraction request for job: {data.get('job_id')}")
                
                content_block = data.get("content", {})
                markdown_text = content_block.get("combined_markdown") or content_block.get("markdown", "")
                schema = data.get("schema", {})
                extraction_type = data.get("extractionType", "llm")
                examples = data.get("examples", [])
                model_id = data.get("model_id") or data.get("modelId")
                
                if not markdown_text:
                    logger.warning("No markdown content provided")
                    continue

                # Run Extraction (Blocking IO -> Thread)
                # We pass model_id if it exists, otherwise the extractor's default will be used
                kwargs = {
                    "extraction_type": extraction_type,
                    "examples": examples
                }
                if model_id:
                    kwargs["model_id"] = model_id

                result = await asyncio.to_thread(
                    run_extraction,
                    markdown_text,
                    schema,
                    **kwargs
                )
                
                # Produce Request
                event = {
                    "job_id": data.get("job_id"),
                    "status": "success",
                    "data": result["data"],
                    "usage": result["usage"]
                }
                
                await kafka_client.send_message(TOPIC_COMPLETED, event)
                logger.info(f"Completed extraction for {data.get('job_id')}")

            except Exception as e:
                logger.error(f"Error extracting: {e}")
                
    except asyncio.CancelledError:
        pass
    finally:
        await consumer.stop()
        await kafka_client.stop_producer()
