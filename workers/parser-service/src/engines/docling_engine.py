"""
Thin wrapper around the Docling subprocess worker.

The heavy ML models live in a child process. When the child is idle for
DOCLING_IDLE_SECONDS it exits on its own, the OS reclaims ~2GB of RAM.
The next parse job transparently respawns the child.
"""
import logging
import multiprocessing
import os
import threading
from hashlib import sha256

from ..parser_engine import ParserEngine, ParseResult
from ..parse_cache import get_cached_result, set_cached_result

logger = logging.getLogger(__name__)

SUBPROCESS_TIMEOUT = int(os.getenv("PARSE_TIMEOUT_SECONDS", "600"))  # 10 min hard limit


class DoclingEngine(ParserEngine):
    name = "docling"

    def __init__(self):
        self._process: multiprocessing.Process | None = None
        self._job_queue: multiprocessing.Queue | None = None
        self._result_queue: multiprocessing.Queue | None = None
        # Serialise calls — subprocess is single-threaded
        self._lock = threading.Lock()

    def _ensure_subprocess(self) -> None:
        if self._process is not None and self._process.is_alive():
            return

        from .docling_subprocess_worker import worker_main

        ctx = multiprocessing.get_context("spawn")
        self._job_queue = ctx.Queue()
        self._result_queue = ctx.Queue()
        self._process = ctx.Process(
            target=worker_main,
            args=(self._job_queue, self._result_queue),
            daemon=True,
        )
        self._process.start()
        logger.info(f"Docling subprocess spawned (pid={self._process.pid})")

    def warm_up(self) -> None:
        logger.info("Docling engine ready — subprocess spawns on first job")

    def _call(self, job: dict) -> dict:
        """Send a job to the subprocess and return its result. Caller must hold _lock."""
        self._ensure_subprocess()
        self._job_queue.put(job)
        result = self._result_queue.get(timeout=SUBPROCESS_TIMEOUT)
        if result["status"] == "error":
            raise RuntimeError(result["error"])
        return result

    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            return ParseResult(**cached)

        with self._lock:
            data = self._call({"type": "bytes", "file_bytes": file_bytes, "file_name": file_name})

        result = ParseResult(
            markdown_content=data["markdown_content"],
            token_count=data["token_count"],
        )
        set_cached_result(
            file_hash,
            {"markdown_content": result.markdown_content, "token_count": result.token_count},
            self.name,
        )
        return result

    def parse_url(self, url: str) -> ParseResult:
        with self._lock:
            data = self._call({"type": "url", "url": url})

        return ParseResult(
            markdown_content=data["markdown_content"],
            token_count=data["token_count"],
        )
