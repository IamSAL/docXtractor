import os
import io
import threading
import concurrent.futures
import logging
from hashlib import sha256

import torch
torch.backends.mkldnn.enabled = False

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.accelerator_options import AcceleratorOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, DocumentStream
from docling.exceptions import ConversionError

from ..parser_engine import ParserEngine, ParseResult
from ..parse_cache import get_cached_result, set_cached_result, compute_file_hash
from ..pdf_preprocessor import preprocess_pdf, split_pdf_into_chunks, PDF_CHUNK_SIZE

logger = logging.getLogger(__name__)

DO_TABLE_STRUCTURE = os.getenv("DO_TABLE_STRUCTURE", "true").lower() == "true"
PDF_CHUNK_WORKERS = int(os.getenv("PDF_CHUNK_WORKERS", "4"))
PARSER_CONCURRENCY = int(os.getenv("PARSER_CONCURRENCY", "2"))
_THREADS_PER_DOC = int(os.getenv("THREADS_PER_DOC", str(max(1, (os.cpu_count() or 4) // max(1, PARSER_CONCURRENCY)))))
#_THREADS_PER_DOC = 1


class DoclingEngine(ParserEngine):
    name = "docling"

    def __init__(self):
        logger.info(f"PARSER_CONCURRENCY:{PARSER_CONCURRENCY}")
        self._converters: dict = {}
        self._converters_lock = threading.Lock()

    def _get_converter(self, backend: str = "dlparse_v2") -> DocumentConverter:
        key = f"{backend}_tbl{DO_TABLE_STRUCTURE}"
        if key not in self._converters:
            with self._converters_lock:
                if key not in self._converters:
                    pipeline_options = PdfPipelineOptions(
                        do_ocr=False,
                        do_table_structure=DO_TABLE_STRUCTURE,
                        pdf_backend=backend,
                        accelerator_options=AcceleratorOptions(num_threads=_THREADS_PER_DOC),
                    )
                    self._converters[key] = DocumentConverter(
                        allowed_formats=[InputFormat.PDF],
                        format_options={
                            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                        },
                    )
        return self._converters[key]

    def _convert_with_fallback(self, name: str, file_bytes: bytes):
        try:
            buf = io.BytesIO(file_bytes)
            source = DocumentStream(name=name, stream=buf)
            result = self._get_converter("dlparse_v2").convert(source)
            buf.close()
            return result
        except ConversionError as e:
            logger.warning(f"dlparse_v2 failed ({e}), retrying with pypdfium2 backend")
            buf = io.BytesIO(file_bytes)
            source = DocumentStream(name=name, stream=buf)
            result = self._get_converter("pypdfium2").convert(source)
            buf.close()
            return result

    def _convert_chunk(self, chunk_bytes: bytes, name: str, chunk_idx: int) -> str:
        result = self._convert_with_fallback(f"{name}_chunk{chunk_idx}", chunk_bytes)
        markdown = result.document.export_to_markdown()
        del result
        return markdown

    def warm_up(self) -> None:
        logger.info("Pre-warming Docling converters...")
        self._get_converter("dlparse_v2")
        self._get_converter("pypdfium2")
        logger.info("Docling converters ready")

    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            return ParseResult(**cached)

        logger.info(f"Using Docling pipeline for {file_name}")
        file_bytes = preprocess_pdf(file_bytes)

        if PDF_CHUNK_SIZE > 0:
            chunks = split_pdf_into_chunks(file_bytes, PDF_CHUNK_SIZE)
            del file_bytes  # chunks own their own bytes now; release original
        else:
            chunks = None

        if chunks is not None and len(chunks) > 1:
            logger.info(f"Processing {len(chunks)} chunks in parallel (workers={PDF_CHUNK_WORKERS})")
            with concurrent.futures.ThreadPoolExecutor(max_workers=PDF_CHUNK_WORKERS) as executor:
                futures = {
                    executor.submit(self._convert_chunk, chunk, file_name, i): i
                    for i, chunk in enumerate(chunks)
                }
                del chunks  # free chunk bytes as futures are submitted
                results_by_idx = {}
                for f in concurrent.futures.as_completed(futures):
                    results_by_idx[futures[f]] = f.result()
            markdown_content = "\n\n".join(results_by_idx[i] for i in sorted(results_by_idx))
            del results_by_idx
        else:
            if chunks is not None:
                file_bytes = chunks[0]
                del chunks
            result = self._convert_with_fallback(file_name, file_bytes)
            del file_bytes
            markdown_content = result.document.export_to_markdown()
            del result

        parse_result = ParseResult(
            markdown_content=markdown_content,
            token_count=len(markdown_content.split()),
        )
        set_cached_result(file_hash, {
            "markdown_content": parse_result.markdown_content,
            "token_count": parse_result.token_count,
        }, self.name)
        return parse_result

    def parse_url(self, url: str) -> ParseResult:
        import requests

        local_path = f"/tmp/docling_{url.split('/')[-1]}"
        try:
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()
            with open(local_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_hash = compute_file_hash(local_path)
            cached = get_cached_result(file_hash, self.name)
            if cached:
                os.remove(local_path)
                return ParseResult(**cached)

            with open(local_path, "rb") as fh:
                raw_bytes = fh.read()
            os.remove(local_path)
            result = self._convert_with_fallback(local_path, raw_bytes)
            del raw_bytes
            markdown_content = result.document.export_to_markdown()
            del result

            parse_result = ParseResult(
                markdown_content=markdown_content,
                token_count=len(markdown_content.split()),
            )
            set_cached_result(file_hash, {
                "markdown_content": parse_result.markdown_content,
                "token_count": parse_result.token_count,
            }, self.name)
            return parse_result

        except Exception as e:
            if os.path.exists(local_path):
                os.remove(local_path)
            raise
