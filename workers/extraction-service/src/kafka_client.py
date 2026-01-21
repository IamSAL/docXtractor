import asyncio
import json
import logging
import os
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

class KafkaClient:
    def __init__(self):
        self.producer = None

    async def start_producer(self):
        retries = 0
        max_retries = 20
        while retries < max_retries:
            try:
                self.producer = AIOKafkaProducer(
                    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8')
                )
                await self.producer.start()
                logger.info("Kafka Producer started")
                return
            except Exception as e:
                retries += 1
                logger.error(f"Failed to start producer (attempt {retries}/{max_retries}): {e}")
                await asyncio.sleep(5)
        raise Exception("Failed to connect to Kafka after multiple retries")

    async def stop_producer(self):
        if self.producer:
            await self.producer.stop()

    async def send_message(self, topic: str, value: dict):
        if not self.producer:
            raise Exception("Producer not started")
        try:
            await self.producer.send_and_wait(topic, value)
            logger.info(f"Sent message to {topic}")
        except Exception as e:
            logger.error(f"Failed to send message: {e}")

    @staticmethod
    def get_consumer(topic: str, group_id: str):
        # The consumer.start() call in consumer.py also needs to handle connection errors, 
        # but typically AIOKafkaConsumer handles initial bootstrap better or throws immediately.
        # We will assume connection is handled there, or we can improve robustness in consumer.py.
        return AIOKafkaConsumer(
            topic,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=group_id,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            auto_offset_reset='earliest'
        )

kafka_client = KafkaClient()
