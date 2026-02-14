import asyncio
import logging
import os
from bullmq import Queue, Worker, Job
from typing import Callable, Any, Awaitable

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class BullMQClient:
    def __init__(self):
        self._queues = {}

    def get_queue(self, name: str) -> Queue:
        if name not in self._queues:
            self._queues[name] = Queue(name, connection=REDIS_URL)
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

    def create_worker(self, queue_name: str, processor: Callable[[Job], Awaitable[Any]]):
        return Worker(queue_name, processor, connection=REDIS_URL)

bullmq_client = BullMQClient()
