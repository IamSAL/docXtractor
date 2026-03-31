import os
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ParseResult:
    markdown_content: str
    token_count: int


class ParserEngine(ABC):
    """Common interface for all parser engines."""

    name: str

    @abstractmethod
    def parse_bytes(self, file_bytes: bytes, file_name: str) -> ParseResult:
        """Parse a file from raw bytes. file_name is used to infer file type."""
        ...

    @abstractmethod
    def parse_url(self, url: str) -> ParseResult:
        """Parse a document from a URL."""
        ...

    def warm_up(self) -> None:
        """Optional warm-up step (e.g. pre-loading models). No-op by default."""
        pass


_engine_instance: ParserEngine | None = None


def get_engine() -> ParserEngine:
    """Return the singleton parser engine based on PARSER_ENGINE env var."""
    global _engine_instance
    if _engine_instance is not None:
        return _engine_instance

    engine_name = os.getenv("PARSER_ENGINE", "docling").lower()

    if engine_name == "markitdown":
        from .engines.markitdown_engine import MarkItDownEngine
        _engine_instance = MarkItDownEngine()
    elif engine_name == "docling":
        from .engines.docling_engine import DoclingEngine
        _engine_instance = DoclingEngine()
    elif engine_name == "pymupdf":
        from .engines.pymupdf_engine import PyMuPdfEngine
        _engine_instance = PyMuPdfEngine()
    else:
        raise ValueError(f"Unknown parser engine: {engine_name}. Choose from: markitdown, docling, pymupdf")

    logger.info(f"Parser engine initialized: {_engine_instance.name}")
    return _engine_instance
