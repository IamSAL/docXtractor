import os
import logging
import requests
from docling.document_converter import DocumentConverter

logger = logging.getLogger(__name__)

converter = DocumentConverter()

def process_url_document(document_id: str, url: str) -> dict:
    """
    Downloads file from URL, parses with Docling, and returns result.
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
        logger.error(f"Error processing URL document {document_id}: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)
        raise e
