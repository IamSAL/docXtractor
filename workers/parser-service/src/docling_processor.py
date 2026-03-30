import os
import io
import threading
import concurrent.futures
import boto3
import logging
import torch
torch.backends.mkldnn.enabled = False

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.accelerator_options import AcceleratorOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, DocumentStream
from docling.exceptions import ConversionError
from .parse_cache import compute_file_hash, get_cached_result, set_cached_result
from .pdf_preprocessor import preprocess_pdf, split_pdf_into_chunks, PDF_CHUNK_SIZE

logger = logging.getLogger(__name__)

# MinIO Config
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "docxtractor-documents")

# Pipeline options — tune via environment variables:
#   DO_TABLE_STRUCTURE=false  → skip expensive table detection (faster, loses table formatting)
#   PDF_CHUNK_SIZE=20         → split PDFs into N-page chunks for parallel processing
#   PDF_CHUNK_WORKERS=4       → thread pool size for chunk processing
DO_TABLE_STRUCTURE = os.getenv("DO_TABLE_STRUCTURE", "true").lower() == "true"
PDF_CHUNK_WORKERS = int(os.getenv("PDF_CHUNK_WORKERS", "4"))
PARSER_CONCURRENCY = int(os.getenv("PARSER_CONCURRENCY", "4"))

# Limit threads per model inference to avoid CPU oversubscription.
# Total threads = PARSER_CONCURRENCY * _THREADS_PER_DOC ≈ CPU count.
_THREADS_PER_DOC = int(os.getenv("THREADS_PER_DOC", str(max(1, (os.cpu_count() or 4) // max(1, PARSER_CONCURRENCY)))))
torch.set_num_threads(_THREADS_PER_DOC)
logging.getLogger(__name__).info(f"Parser config: concurrency={PARSER_CONCURRENCY}, threads_per_doc={_THREADS_PER_DOC}, cpus={os.cpu_count()}")

s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY
)

_converters: dict = {}
_converters_lock = threading.Lock()


def _get_converter(backend: str = "dlparse_v2") -> DocumentConverter:
    key = f"{backend}_tbl{DO_TABLE_STRUCTURE}"
    if key not in _converters:
        with _converters_lock:
            if key not in _converters:
                pipeline_options = PdfPipelineOptions(
                    do_ocr=False,
                    do_table_structure=DO_TABLE_STRUCTURE,
                    pdf_backend=backend,
                    accelerator_options=AcceleratorOptions(num_threads=_THREADS_PER_DOC),
                )
                _converters[key] = DocumentConverter(
                    allowed_formats=[InputFormat.PDF],
                    format_options={
                        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                    }
                )
    return _converters[key]


def _convert_with_fallback(name: str, file_bytes: bytes):
    """Try dlparse_v2 first, fall back to pypdfium2 on ConversionError."""
    try:
        source = DocumentStream(name=name, stream=io.BytesIO(file_bytes))
        return _get_converter("dlparse_v2").convert(source)
    except ConversionError as e:
        logger.warning(f"dlparse_v2 failed ({e}), retrying with pypdfium2 backend")
        source = DocumentStream(name=name, stream=io.BytesIO(file_bytes))
        return _get_converter("pypdfium2").convert(source)


def _convert_chunk(chunk_bytes: bytes, name: str, chunk_idx: int) -> str:
    """Convert a single PDF chunk to markdown (runs in a worker thread)."""
    result = _convert_with_fallback(f"{name}_chunk{chunk_idx}", chunk_bytes)
    return result.document.export_to_markdown()


# Fast path: extract text directly from digital PDFs using PyMuPDF.
# Falls back to docling for scanned/image-based PDFs.
# Disable with USE_FAST_TEXT_EXTRACT=false if you need docling's ML layout for all docs.
USE_FAST_TEXT_EXTRACT = os.getenv("USE_FAST_TEXT_EXTRACT", "true").lower() == "true"
# Minimum words per page to consider the PDF text-based (not scanned)
FAST_TEXT_MIN_WORDS_PER_PAGE = int(os.getenv("FAST_TEXT_MIN_WORDS_PER_PAGE", "20"))


def _try_fast_text_extract(file_bytes: bytes) -> str | None:
    """
    Try direct text extraction via PyMuPDF. Returns markdown string if the PDF
    has enough embedded text (digital-born), or None if it appears scanned.
    """
    if not USE_FAST_TEXT_EXTRACT:
        return None

    try:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = []
        for page in doc:
            text = page.get_text("text").strip()
            if len(text.split()) < FAST_TEXT_MIN_WORDS_PER_PAGE:
                doc.close()
                return None  # Likely scanned — fall back to docling
            pages_text.append(text)
        doc.close()
        return "\n\n".join(pages_text)
    except Exception:
        return None


def process_document(document_id: str, file_key: str) -> dict:
    try:
        # 1. Stream directly to memory (No disk IO)
        file_stream = io.BytesIO()
        s3_client.download_fileobj(MINIO_BUCKET, file_key, file_stream)
        file_stream.seek(0)
        file_bytes = file_stream.read()

        # 2. Hash original bytes for cache lookup
        from hashlib import sha256
        file_hash = sha256(file_bytes).hexdigest()

        cached = get_cached_result(file_hash)
        if cached:
            return cached

        # 3. Fast path: direct text extraction for digital PDFs
        fast_text = _try_fast_text_extract(file_bytes)
        if fast_text is not None:
            logger.info(f"Fast text extraction succeeded for {file_key}")
            markdown_content = fast_text
        else:
            # 4. Slow path: pre-process + docling ML pipeline
            logger.info(f"Using docling pipeline for {file_key}")
            file_bytes = preprocess_pdf(file_bytes)

            if PDF_CHUNK_SIZE > 0:
                chunks = split_pdf_into_chunks(file_bytes, PDF_CHUNK_SIZE)
            else:
                chunks = [file_bytes]

            if len(chunks) > 1:
                logger.info(
                    f"Processing {len(chunks)} chunks in parallel "
                    f"(workers={PDF_CHUNK_WORKERS}, table_structure={DO_TABLE_STRUCTURE})"
                )
                with concurrent.futures.ThreadPoolExecutor(max_workers=PDF_CHUNK_WORKERS) as executor:
                    futures = {
                        executor.submit(_convert_chunk, chunk, file_key, i): i
                        for i, chunk in enumerate(chunks)
                    }
                    results_by_idx = {}
                    for f in concurrent.futures.as_completed(futures):
                        results_by_idx[futures[f]] = f.result()
                markdown_content = "\n\n".join(
                    results_by_idx[i] for i in sorted(results_by_idx)
                )
            else:
                result = _convert_with_fallback(file_key, file_bytes)
                markdown_content = result.document.export_to_markdown()

        parse_result = {
            "markdown_content": markdown_content,
            "token_count": len(markdown_content.split())
        }

        set_cached_result(file_hash, parse_result)
        return parse_result

    except Exception as e:
        logger.error(f"Error: {e}")
        raise e
