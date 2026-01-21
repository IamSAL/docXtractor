import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .consumer import consume

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
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
