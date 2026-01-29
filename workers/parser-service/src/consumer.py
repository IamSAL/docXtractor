import asyncio
import json
import logging
from .kafka_client import kafka_client
from .docling_processor import process_document

logger = logging.getLogger(__name__)

TOPIC_UPLOADED = "docxtractor.documents.uploaded"
TOPIC_PARSED = "docxtractor.documents.parsed"
CONSUMER_GROUP = "parser-group"

async def consume():
    """
    Main consumer loop.
    """
    # ensure producer is started
    await kafka_client.start_producer()
    
    consumer = kafka_client.get_consumer(TOPIC_UPLOADED, CONSUMER_GROUP)
    await consumer.start()
    
    logger.info(f"Started consumer for topic {TOPIC_UPLOADED}")
    
    try:
        async for msg in consumer:
            try:
                data = msg.value
                logger.info(f"Received run: {data.get('run_id')} doc: {data.get('document_id')}")
                
                # 1. Parse Input
                # Expected event structure: { "run_id": "...", "document_id": "...", "file_key": "...", ... }
                # We assume 'file_key' is the path in the bucket. If 's3://...' is sent, we'd need to parse it.
                # For now, let's look for 'file_key' or 'file_url'
                file_key = data.get("file_key") or data.get("file_url", "").replace("s3://docxtractor-documents/", "")
                
                if not file_key:
                    logger.error("No file_key found in event")
                    continue

                # 2. Process (Blocking Call run in ThreadPool)
                # docling might be cpu bound, so running in executor is safer for asyncio loop
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
                
                await kafka_client.send_message(TOPIC_PARSED, event)
                logger.info(f"Processed and produced result for {data.get('document_id')}")

            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # TODO: Produce failure event
                
    except asyncio.CancelledError:
        logger.info("Consumer loop cancelled")
    finally:
        await consumer.stop()
        await kafka_client.stop_producer()
