import asyncio
import logging
import os
from bullmq import Queue, Worker, Job
from redis.asyncio import Redis as AsyncRedis
from typing import Callable, Any, Awaitable

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")

class BullMQClient:
    def __init__(self):
        self._queues = {}
        self._redis = None

    async def _get_redis(self) -> AsyncRedis:
        if self._redis is None:
            self._redis = AsyncRedis.from_url(REDIS_URL, decode_responses=True)
        return self._redis

    async def is_run_cancelled(self, run_id: str) -> bool:
        redis = await self._get_redis()
        return await redis.exists(f"run:cancelled:{run_id}") == 1

    def get_queue(self, name: str) -> Queue:
        if name not in self._queues:
            self._queues[name] = Queue(name, opts={"connection": REDIS_URL})
        return self._queues[name]

    async def add_job(self, queue_name: str, name: str, data: dict):
        queue = self.get_queue(queue_name)
        try:
            await queue.add(name, data, {
                "removeOnComplete": True,
                "removeOnFail": 1000
            })
            logger.info(f"Added job to {queue_name}: {name}")
        except Exception as e:
            logger.error(f"Failed to add job to {queue_name}: {e}")
            raise e

    def create_worker(self, queue_name: str, processor: Callable[[Job], Awaitable[Any]], concurrency: int = 1):
        return Worker(queue_name, processor, opts={"connection": REDIS_URL, "concurrency": concurrency})

bullmq_client = BullMQClient()

