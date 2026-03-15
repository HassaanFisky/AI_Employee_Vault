"""
src/workers/redis_producer.py
Redis producer — publishes messages to a Redis List queue.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

import redis.asyncio as redis
import structlog

from src.config.settings import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()

class RedisProducer:
    """Publishes messages to Redis queues."""
    def __init__(self) -> None:
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)

    async def publish_message(
        self,
        channel: str,
        sender_id: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """
        Publish a message to the incoming Redis list queue.
        Returns a unique event ID.
        """
        event_id = str(uuid.uuid4())
        payload = {
            "event_id": event_id,
            "channel": channel,
            "sender_id": sender_id,
            "content": content,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        await self.redis.lpush(settings.redis_queue_incoming, json.dumps(payload))
        
        log.info(
            "Message published to Redis",
            event_id=event_id,
            channel=channel,
            sender_id=sender_id[:10] if sender_id else None,
        )
        return event_id

    async def close(self) -> None:
        await self.redis.aclose()


_producer: RedisProducer | None = None

def get_producer() -> RedisProducer:
    """Get the singleton producer instance."""
    global _producer
    if _producer is None:
        _producer = RedisProducer()
    return _producer
