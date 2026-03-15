"""
src/workers/redis_worker.py
Redis consumer worker — pops the intake queue and drives the AI agent.
Designed to run as a standalone process (multiple replicas for parallelism).
"""
from __future__ import annotations

import asyncio
import json
import signal
from datetime import datetime, timezone

import redis.asyncio as redis
import structlog

from src.agent.agent import MessageEvent, run_agent
from src.agent.context import hydrate_event
from src.config.settings import get_settings
from src.database.connection import init_engine

log = structlog.get_logger(__name__)
settings = get_settings()


class AgentWorker:
    """Redis consumer that drives the AI agent for each message."""

    def __init__(self) -> None:
        self._running = False
        self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)

    def start(self) -> None:
        """Mark worker as running."""
        self._running = True
        log.info(
            "Worker started polling queue",
            queue=settings.redis_queue_incoming,
        )

    def stop(self) -> None:
        """Graceful shutdown."""
        self._running = False
        log.info("Worker gracefully stopping")

    async def close(self) -> None:
        await self.redis_client.aclose()

    async def run_loop(self) -> None:
        """Main poll-process loop. Run this as the asyncio entry point."""
        self.start()
        try:
            while self._running:
                # BRPOP blocks until a message is available
                # It returns a tuple: (queue_name, popped_value) or None on timeout
                result = await self.redis_client.brpop(settings.redis_queue_incoming, timeout=2)
                
                if result is None:
                    continue
                
                _, msg_payload = result
                await self._process_message(msg_payload)

        except Exception as exc:
            log.error("Redis worker fatal error", error=str(exc))
        finally:
            await self.close()

    async def _process_message(self, msg_payload: str) -> None:
        """Deserialize a Redis message and run the agent."""
        try:
            payload = json.loads(msg_payload)
        except (json.JSONDecodeError, TypeError) as exc:
            log.error("Message deserialization failed", error=str(exc))
            await self._send_to_dlq(msg_payload, reason="deserialization_error")
            return

        event = MessageEvent(
            channel=payload.get("channel", "webform"),
            sender_id=payload.get("sender_id", "unknown"),
            content=payload.get("content", ""),
            channel_thread_id=payload.get("metadata", {}).get("thread_id", ""),
            metadata=payload.get("metadata", {}),
            received_at=datetime.now(timezone.utc),
        )

        log.info(
            "Processing message",
            event_id=payload.get("event_id"),
            channel=event.channel,
        )

        try:
            # Hydrate: resolve customer, conversation, persist inbound msg
            event = await hydrate_event(event)

            # Run AI agent
            result = await asyncio.wait_for(
                run_agent(event),
                timeout=float(settings.max_processing_seconds),
            )

            if result["success"]:
                log.info(
                    "Agent succeeded",
                    processing_ms=result.get("processing_ms"),
                    escalated=result.get("was_escalated"),
                )
            else:
                log.warning("Agent returned failure", error=result.get("error"))
                await self._send_to_dlq(msg_payload, reason="agent_failure")

        except asyncio.TimeoutError:
            log.error("Agent timed out", channel=event.channel)
            await self._send_to_dlq(msg_payload, reason="timeout")
        except Exception as exc:
            log.error("Unhandled processing error", error=str(exc))
            await self._send_to_dlq(msg_payload, reason="unhandled_exception")


    async def _send_to_dlq(self, payload_str: str, reason: str) -> None:
        """Forward a failed message to the dead-letter queue."""
        try:
            dlq_payload = json.dumps(
                {
                    "original_value": payload_str,
                    "failure_reason": reason,
                    "failed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            await self.redis_client.lpush(settings.redis_queue_deadletter, dlq_payload)
        except Exception as exc:
            log.error("DLQ send failed", error=str(exc))


async def _main() -> None:
    """Entry point for standalone worker process."""
    import structlog
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(),
        ]
    )

    # Init DB pool
    init_engine()

    worker = AgentWorker()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, worker.stop)

    await worker.run_loop()


if __name__ == "__main__":
    asyncio.run(_main())
