"""
Subprocess entry point for Docling-based document parsing.

This module is imported by a fresh Python process (via multiprocessing spawn).
Heavy ML model weights load on first converter use, then stay resident for the
lifetime of the subprocess. When the subprocess exits (idle timeout), the OS
reclaims all memory including torch tensors.
"""
import concurrent.futures
import gc
import io
import logging
import os
import queue
import sys

import torch
torch.backends.mkldnn.enabled = False

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.accelerator_options import AcceleratorOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, DocumentStream
from docling.exceptions import ConversionError

from ..pdf_preprocessor import preprocess_pdf, split_pdf_into_chunks, PDF_CHUNK_SIZE

logger = logging.getLogger(__name__)

DO_TABLE_STRUCTURE = os.getenv("DO_TABLE_STRUCTURE", "true").lower() == "true"
PDF_CHUNK_WORKERS = int(os.getenv("PDF_CHUNK_WORKERS", "4"))
IDLE_SECONDS = int(os.getenv("DOCLING_IDLE_SECONDS", "60"))
_THREADS_PER_DOC = int(os.getenv("THREADS_PER_DOC", str(max(1, (os.cpu_count() or 4)))))

# Module-level converter cache — lives for the lifetime of this subprocess only
_converters: dict = {}


def _make_converter(backend: str) -> DocumentConverter:
    return DocumentConverter(
        allowed_formats=[InputFormat.PDF],
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=PdfPipelineOptions(
                    do_ocr=False,
                    do_table_structure=DO_TABLE_STRUCTURE,
                    pdf_backend=backend,
                    accelerator_options=AcceleratorOptions(num_threads=_THREADS_PER_DOC),
                )
            )
        },
    )


def _get_converter(backend: str = "dlparse_v2") -> DocumentConverter:
    if backend not in _converters:
        _converters[backend] = _make_converter(backend)
    return _converters[backend]


def _convert_with_fallback(name: str, file_bytes: bytes):
    try:
        buf = io.BytesIO(file_bytes)
        source = DocumentStream(name=name, stream=buf)
        result = _get_converter("dlparse_v2").convert(source)
        buf.close()
        return result
    except ConversionError as e:
        logger.warning(f"dlparse_v2 failed ({e}), retrying with pypdfium2")
        buf = io.BytesIO(file_bytes)
        source = DocumentStream(name=name, stream=buf)
        fallback = _make_converter("pypdfium2")
        try:
            result = fallback.convert(source)
        finally:
            buf.close()
            del fallback
            gc.collect()
        return result


def _convert_chunk(chunk_bytes: bytes, name: str, chunk_idx: int) -> str:
    result = _convert_with_fallback(f"{name}_chunk{chunk_idx}", chunk_bytes)
    markdown = result.document.export_to_markdown()
    del result
    return markdown


def _do_parse_bytes(file_bytes: bytes, file_name: str) -> dict:
    file_bytes = preprocess_pdf(file_bytes)

    if PDF_CHUNK_SIZE > 0:
        chunks = split_pdf_into_chunks(file_bytes, PDF_CHUNK_SIZE)
        del file_bytes
    else:
        chunks = None

    if chunks is not None and len(chunks) > 1:
        logger.info(f"Processing {len(chunks)} chunks (workers={PDF_CHUNK_WORKERS})")
        with concurrent.futures.ThreadPoolExecutor(max_workers=PDF_CHUNK_WORKERS) as executor:
            futures = {
                executor.submit(_convert_chunk, chunk, file_name, i): i
                for i, chunk in enumerate(chunks)
            }
            del chunks
            results_by_idx = {}
            for f in concurrent.futures.as_completed(futures):
                results_by_idx[futures[f]] = f.result()
        markdown_content = "\n\n".join(results_by_idx[i] for i in sorted(results_by_idx))
    else:
        if chunks is not None:
            file_bytes = chunks[0]
            del chunks
        result = _convert_with_fallback(file_name, file_bytes)
        del file_bytes
        markdown_content = result.document.export_to_markdown()
        del result

    return {
        "markdown_content": markdown_content,
        "token_count": len(markdown_content.split()),
    }


def _do_parse_url(url: str) -> dict:
    import requests

    local_path = f"/tmp/docling_{url.split('/')[-1]}"
    try:
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        with open(local_path, "rb") as fh:
            raw_bytes = fh.read()
        os.remove(local_path)
        result = _convert_with_fallback(local_path, raw_bytes)
        del raw_bytes
        markdown_content = result.document.export_to_markdown()
        del result
        return {
            "markdown_content": markdown_content,
            "token_count": len(markdown_content.split()),
        }
    except Exception:
        if os.path.exists(local_path):
            os.remove(local_path)
        raise


def worker_main(job_queue, result_queue):
    """
    Entry point for the Docling subprocess.
    Loads models, processes jobs until idle, then exits — freeing all RAM.
    """
    logging.basicConfig(
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger.info(f"Docling subprocess started (pid={os.getpid()}, idle_timeout={IDLE_SECONDS}s)")

    # Warm up primary converter so first job doesn't pay extra init cost
    logger.info("Loading Docling models...")
    _get_converter("dlparse_v2")
    logger.info("Models loaded — ready for jobs")

    while True:
        try:
            job = job_queue.get(timeout=IDLE_SECONDS)
        except queue.Empty:
            logger.info(
                f"No jobs for {IDLE_SECONDS}s — subprocess exiting, OS will reclaim memory"
            )
            sys.exit(0)

        try:
            if job["type"] == "bytes":
                data = _do_parse_bytes(job["file_bytes"], job["file_name"])
            else:
                data = _do_parse_url(job["url"])
            result_queue.put({"status": "ok", **data})
        except Exception as e:
            import traceback
            logger.error(f"Parse failed: {e}", exc_info=True)
            result_queue.put({
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc(),
            })
