import asyncio
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .consumer import consume

LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.DEBUG),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Extraction Service...")
    task = asyncio.create_task(consume())
    yield
    logger.info("Shutting down...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok", "service": "extraction-service"}
