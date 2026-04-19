import asyncio
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
from .consumer import consume
from .parser_engine import get_engine

# Configure Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.DEBUG),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — initialize engine and optional warm-up
    engine = get_engine()
    logger.info(f"Warming up parser engine: {engine.name}")
    await asyncio.to_thread(engine.warm_up)
    logger.info("Engine ready, starting consumer...")
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
    engine = get_engine()
    return {"status": "ok", "service": "parser-service", "engine": engine.name}

@app.post("/parse-file")
async def parse_file(file: UploadFile = File(...)):
    engine = get_engine()
    content = await file.read()
    result = await asyncio.to_thread(engine.parse_bytes, content, file.filename or "document")
    return {"text": result.markdown_content[:8000]}
