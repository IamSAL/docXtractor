import hashlib
import json
import logging
import os

import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")
CACHE_TTL = int(os.getenv("PARSE_CACHE_TTL", str(60 * 60 * 24 * 7)))  # 7 days default
CACHE_ENABLED = os.getenv("PARSE_CACHE_ENABLED", "true").lower() == "true"
CACHE_PREFIX = "parse_cache:"

_redis_client = None


def _get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


def compute_file_hash(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def get_cached_result(file_hash: str, engine_name: str = "docling") -> dict | None:
    if not CACHE_ENABLED:
        return None
    try:
        key = f"{CACHE_PREFIX}{engine_name}:{file_hash}"
        data = _get_redis().get(key)
        if data:
            logger.info(f"Cache HIT for {engine_name}:{file_hash[:12]}...")
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")
    return None


def set_cached_result(file_hash: str, result: dict, engine_name: str = "docling"):
    if not CACHE_ENABLED:
        return
    try:
        key = f"{CACHE_PREFIX}{engine_name}:{file_hash}"
        _get_redis().setex(
            key,
            CACHE_TTL,
            json.dumps(result),
        )
        logger.info(f"Cached result for {engine_name}:{file_hash[:12]}... (TTL={CACHE_TTL}s)")
    except Exception as e:
        logger.warning(f"Cache store failed: {e}")
