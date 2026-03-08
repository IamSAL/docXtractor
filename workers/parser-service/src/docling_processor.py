import os
import io
import threading
import boto3
import logging
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, DocumentStream
from docling.exceptions import ConversionError
from .parse_cache import compute_file_hash, get_cached_result, set_cached_result

logger = logging.getLogger(__name__)

# MinIO Config
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "docxtractor-documents")

s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY
)

_thread_local = threading.local()


def _get_converter(backend: str = "dlparse_v2") -> DocumentConverter:
    attr = f"converter_{backend}"
    if not hasattr(_thread_local, attr):
        pipeline_options = PdfPipelineOptions(
            do_ocr=False,
            do_table_structure=True,
            pdf_backend=backend,
        )
        converter = DocumentConverter(
            allowed_formats=[InputFormat.PDF],
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        setattr(_thread_local, attr, converter)
    return getattr(_thread_local, attr)


def _convert_with_fallback(name: str, file_bytes: bytes):
    """Try dlparse_v2 first, fall back to pypdfium2 on ConversionError."""
    try:
        source = DocumentStream(name=name, stream=io.BytesIO(file_bytes))
        return _get_converter("dlparse_v2").convert(source)
    except ConversionError as e:
        logger.warning(f"dlparse_v2 failed ({e}), retrying with pypdfium2 backend")
        source = DocumentStream(name=name, stream=io.BytesIO(file_bytes))
        return _get_converter("pypdfium2").convert(source)


def process_document(document_id: str, file_key: str) -> dict:
    try:
        # 1. Stream directly to memory (No disk IO)
        file_stream = io.BytesIO()
        s3_client.download_fileobj(MINIO_BUCKET, file_key, file_stream)
        file_stream.seek(0)
        file_bytes = file_stream.read()

        # 2. Hash in memory
        from hashlib import sha256
        file_hash = sha256(file_bytes).hexdigest()

        cached = get_cached_result(file_hash)
        if cached:
            return cached

        # 3. Convert from stream (with fallback backend)
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
