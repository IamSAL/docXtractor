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


_engine_registry: dict[str, ParserEngine] = {}
_registry_lock = __import__("threading").Lock()


def unload_engines() -> None:
    """Evict all cached engine instances to free RAM. Next call to get_engine() re-initializes."""
    import gc
    with _registry_lock:
        for engine in _engine_registry.values():
            # DoclingEngine keeps DocumentConverter instances; drop them explicitly
            if hasattr(engine, "_converters"):
                engine._converters.clear()
        _engine_registry.clear()
    gc.collect()
    logger.info("Engine registry cleared — memory released")


def get_engine(engine_name: str | None = None) -> ParserEngine:
    """Return the parser engine for the given name. Lazy-initializes on first use."""
    if engine_name is None:
        engine_name = os.getenv("PARSER_ENGINE", "docling").lower()
    else:
        engine_name = engine_name.lower()

    if engine_name in _engine_registry:
        return _engine_registry[engine_name]

    with _registry_lock:
        if engine_name in _engine_registry:
            return _engine_registry[engine_name]

        if engine_name == "markitdown":
            from .engines.markitdown_engine import MarkItDownEngine
            engine = MarkItDownEngine()
        elif engine_name == "docling":
            from .engines.docling_engine import DoclingEngine
            engine = DoclingEngine()
        elif engine_name == "pymupdf":
            from .engines.pymupdf_engine import PyMuPdfEngine
            engine = PyMuPdfEngine()
        elif engine_name == "opendataloader":
            from .engines.opendataloader_engine import OpenDataLoaderEngine
            engine = OpenDataLoaderEngine()
        else:
            raise ValueError(
                f"Unknown parser engine: {engine_name}. "
                "Choose from: docling, markitdown, pymupdf, opendataloader"
            )

        logger.info(f"Parser engine initialized: {engine.name}")
        _engine_registry[engine_name] = engine
        return engine
