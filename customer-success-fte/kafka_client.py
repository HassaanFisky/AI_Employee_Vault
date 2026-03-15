import os
import json
from datetime import datetime, timezone
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from aiokafka.helpers import create_ssl_context
from dotenv import load_dotenv

load_dotenv()

TOPICS = {
    'tickets_incoming': 'fte.tickets.incoming',
    'escalations':      'fte.escalations',
    'metrics':          'fte.metrics',
    'dlq':              'fte.dlq'
}

def get_kafka_config():
    return {
        "bootstrap_servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
        "security_protocol": "SASL_SSL",
        "sasl_mechanism": "PLAIN",
        "sasl_plain_username": os.getenv("KAFKA_API_KEY"),
        "sasl_plain_password": os.getenv("KAFKA_API_SECRET"),
        "ssl_context": create_ssl_context(),
    }

class FTEKafkaProducer:
    def __init__(self):
        self.producer = None

    async def start(self):
        self.producer = AIOKafkaProducer(
            **get_kafka_config(),
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def publish(self, topic: str, event: dict):
        event["timestamp"] = datetime.now(timezone.utc).isoformat()
        await self.producer.send_and_wait(topic, event)

class FTEKafkaConsumer:
    def __init__(self, topics: list, group_id: str):
        self.topics = topics
        self.group_id = group_id
        self.consumer = None

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            *self.topics,
            **get_kafka_config(),
            group_id=self.group_id,
            value_deserializer=lambda v: json.loads(v.decode('utf-8'))
        )
        await self.consumer.start()

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()

    async def consume(self, handler):
        async for msg in self.consumer:
            await handler(msg.topic, msg.value)
