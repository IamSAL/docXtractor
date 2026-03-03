import os
import threading
import logging
import requests
from docling.document_converter import DocumentConverter
from .parse_cache import compute_file_hash, get_cached_result, set_cached_result

logger = logging.getLogger(__name__)

_thread_local = threading.local()


def _get_converter() -> DocumentConverter:
    if not hasattr(_thread_local, "converter"):
        _thread_local.converter = DocumentConverter()
    return _thread_local.converter

def process_url_document(document_id: str, url: str) -> dict:
    """
    Downloads file from URL, parses with Docling, and returns result.
    Uses SHA-256 hash of the downloaded content to cache parsed results.
    """
    local_path = f"/tmp/{document_id}_{url.split('/')[-1]}"

    try:
        logger.info(f"Downloading {url} to {local_path}")

        # Download the file from URL
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()

        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_hash = compute_file_hash(local_path)
        logger.info(f"File hash: {file_hash[:12]}...")

        cached = get_cached_result(file_hash)
        if cached:
            logger.info(f"Returning cached parse result for {url}")
            os.remove(local_path)
            return cached

        logger.info(f"Parsing {local_path} with Docling...")
        result = _get_converter().convert(local_path)
        markdown_content = result.document.export_to_markdown()

        # Cleanup
        os.remove(local_path)

        parse_result = {
            "markdown_content": markdown_content,
            "token_count": len(markdown_content.split()) # Rough estimate
        }

        set_cached_result(file_hash, parse_result)

        return parse_result

    except Exception as e:
        logger.error(f"Error processing URL document {document_id}: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)
        raise e
