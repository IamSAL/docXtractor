import os
import io
import logging
import boto3
import requests

import pymupdf4llm

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


def process_document(document_id: str, file_key: str) -> dict:
    try:
        # 1. Stream directly to memory
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

        # 3. Write to temp file (pymupdf4llm needs a file path)
        tmp_path = f"/tmp/{document_id}_{file_key.replace('/', '_')}"
        with open(tmp_path, 'wb') as f:
            f.write(file_bytes)

        try:
            markdown_content = pymupdf4llm.to_markdown(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        parse_result = {
            "markdown_content": markdown_content,
            "token_count": len(markdown_content.split())
        }

        set_cached_result(file_hash, parse_result)
        return parse_result

    except Exception as e:
        logger.error(f"Error: {e}")
        raise e


def process_url_document(document_id: str, url: str) -> dict:
    local_path = f"/tmp/{document_id}_{url.split('/')[-1]}"

    try:
        logger.info(f"Downloading {url} to {local_path}")

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

        logger.info(f"Parsing {local_path} with pymupdf4llm...")
        markdown_content = pymupdf4llm.to_markdown(local_path)

        os.remove(local_path)

        parse_result = {
            "markdown_content": markdown_content,
            "token_count": len(markdown_content.split())
        }

        set_cached_result(file_hash, parse_result)
        return parse_result

    except Exception as e:
        logger.error(f"Error processing URL document {document_id}: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)
        raise e
