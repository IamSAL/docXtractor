import os
import boto3
import logging
from docling.document_converter import DocumentConverter

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

converter = DocumentConverter()

def process_document(document_id: str, file_key: str) -> dict:
    """
    Downloads file from MinIO, parses with Docling, and returns result.
    """
    local_path = f"/tmp/{document_id}_{os.path.basename(file_key)}"
    
    try:
        logger.info(f"Downloading {file_key} from bucket {MINIO_BUCKET} to {local_path}")
        s3_client.download_file(MINIO_BUCKET, file_key, local_path)
        
        logger.info(f"Parsing {local_path} with Docling...")
        result = converter.convert(local_path)
        markdown_content = result.document.export_to_markdown()
        
        # Cleanup
        os.remove(local_path)
        
        return {
            "markdown_content": markdown_content,
            "token_count": len(markdown_content.split()) # Rough estimate
        }
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)
        raise e
