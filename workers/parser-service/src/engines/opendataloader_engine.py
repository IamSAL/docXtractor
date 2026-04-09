import os
import tempfile
import logging
from hashlib import sha256

from ..parser_engine import ParserEngine, ParseResult
from ..parse_cache import get_cached_result, set_cached_result

logger = logging.getLogger(__name__)

# Configuration via environment variables
USE_STRUCT_TREE = os.getenv("OPENDATALOADER_USE_STRUCT_TREE", "true").lower() == "true"
READING_ORDER = os.getenv("OPENDATALOADER_READING_ORDER", "xycut")
TABLE_METHOD = os.getenv("OPENDATALOADER_TABLE_METHOD", "cluster")
INCLUDE_HEADER_FOOTER = os.getenv("OPENDATALOADER_INCLUDE_HEADER_FOOTER", "false").lower() == "true"
KEEP_LINE_BREAKS = os.getenv("OPENDATALOADER_KEEP_LINE_BREAKS", "true").lower() == "true"
SANITIZE = os.getenv("OPENDATALOADER_SANITIZE", "false").lower() == "true"
CONTENT_SAFETY = os.getenv("OPENDATALOADER_CONTENT_SAFETY", "true").lower() == "true"


class OpenDataLoaderEngine(ParserEngine):
    name = "opendataloader"

    def _convert_to_markdown(self, input_path: str, output_dir: str) -> str:
        """Run opendataloader-pdf convert and read the markdown output."""
        from opendataloader_pdf import convert

        convert(
            input_path,
            output_dir=output_dir,
            format="markdown",
            use_struct_tree=USE_STRUCT_TREE,
            reading_order=READING_ORDER,
            table_method=TABLE_METHOD,
            include_header_footer=INCLUDE_HEADER_FOOTER,
            keep_line_breaks=KEEP_LINE_BREAKS,
            sanitize=SANITIZE,
            content_safety=CONTENT_SAFETY,
        )

        # opendataloader writes output as <stem>.md in output_dir
        stem = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{stem}.md")

        if not os.path.exists(output_path):
            # Fallback: find any .md file in output_dir
            md_files = [f for f in os.listdir(output_dir) if f.endswith(".md")]
            if not md_files:
                raise RuntimeError(f"No markdown output found in {output_dir}")
            output_path = os.path.join(output_dir, md_files[0])

        with open(output_path, "r", encoding="utf-8") as f:
            return f.read()

    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        file_hash = sha256(file_bytes).hexdigest()
        cached = get_cached_result(file_hash, self.name)
        if cached:
            return ParseResult(**cached)

        logger.info(f"Parsing {file_name} with OpenDataLoader (local mode)")

        with tempfile.TemporaryDirectory(prefix="opendataloader_") as tmpdir:
            input_path = os.path.join(tmpdir, file_name or "document.pdf")
            with open(input_path, "wb") as f:
                f.write(file_bytes)

            output_dir = os.path.join(tmpdir, "output")
            os.makedirs(output_dir)

            markdown_content = self._convert_to_markdown(input_path, output_dir)

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
