import io
import os
import logging
import tempfile
from hashlib import sha256

from markitdown import MarkItDown

from ..parser_engine import ParserEngine, ParseResult
from ..parse_cache import get_cached_result, set_cached_result

logger = logging.getLogger(__name__)


class MarkItDownEngine(ParserEngine):
    name = "markitdown"

    def __init__(self):
        self._md = MarkItDown(enable_plugins=False)

    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            logger.info(f"Cache hit for {file_name} (hash={file_hash[:12]})")
            return ParseResult(**cached)

        # MarkItDown needs a file extension to detect type, so use a temp file
        _, ext = os.path.splitext(file_name)
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            logger.info(f"Parsing {file_name} with MarkItDown (ext={ext})")
            result = self._md.convert(tmp_path)
            markdown_content = result.text_content
        finally:
            os.unlink(tmp_path)

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
        from ..parse_cache import compute_file_hash

        logger.info(f"Downloading {url}")
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        file_bytes = response.content

        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            logger.info(f"Cache hit for URL {url}")
            return ParseResult(**cached)

        # Derive extension from URL or content-type
        from urllib.parse import urlparse
        path = urlparse(url).path
        _, ext = os.path.splitext(path)
        if not ext:
            ext = ".html"

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            logger.info(f"Parsing URL content with MarkItDown (ext={ext})")
            result = self._md.convert(tmp_path)
            markdown_content = result.text_content
        finally:
            os.unlink(tmp_path)

        parse_result = ParseResult(
            markdown_content=markdown_content,
            token_count=len(markdown_content.split()),
        )

        set_cached_result(file_hash, {
            "markdown_content": parse_result.markdown_content,
            "token_count": parse_result.token_count,
        }, self.name)

        return parse_result
