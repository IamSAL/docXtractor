import asyncio
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .consumer import consume

# Configure Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.DEBUG),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Parser Service...")
    task = asyncio.create_task(consume())
    yield
    # Shutdown
    logger.info("Shutting down Parser Service...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok", "service": "parser-service"}
