import os
import logging
from hashlib import sha256

import fitz  # PyMuPDF

from ..parser_engine import ParserEngine, ParseResult
from ..parse_cache import get_cached_result, set_cached_result

logger = logging.getLogger(__name__)


class PyMuPdfEngine(ParserEngine):
    name = "pymupdf"

    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            return ParseResult(**cached)

        logger.info(f"Parsing {file_name} with PyMuPDF")
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = []
        for page in doc:
            pages_text.append(page.get_text("text").strip())
        doc.close()

        markdown_content = "\n\n".join(pages_text)
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

        logger.info(f"Downloading {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return self.parse_bytes(response.content, url.split("/")[-1])
