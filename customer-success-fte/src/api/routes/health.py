"""
src/api/routes/health.py
Health check and Prometheus metrics endpoints.
"""
from __future__ import annotations

from datetime import datetime, timezone

import structlog
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text

from src.api.schemas import HealthResponse, MetricsSummary
from src.config.settings import get_settings
from src.database.connection import get_db_session

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Observability"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Deep health check — validates DB and Kafka connectivity."""
    checks: dict[str, str] = {}

    # Database check
    try:
        async with get_db_session() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    # Redis check
    try:
        from src.workers.redis_producer import get_producer
        prod = get_producer()
        await prod.redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    overall = "healthy" if all(v == "ok" for v in checks.values()) else "degraded"

    return HealthResponse(
        status=overall,
        environment=settings.environment,
        timestamp=datetime.now(timezone.utc),
        checks=checks,
    )


@router.get("/readyz")
async def readiness() -> dict:
    """Kubernetes readiness probe — lightweight."""
    return {"status": "ready"}


@router.get("/livez")
async def liveness() -> dict:
    """Kubernetes liveness probe."""
    return {"status": "alive"}


@router.get("/metrics")
async def prometheus_metrics() -> Response:
    """Expose Prometheus metrics in text format."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


@router.get("/metrics/summary", response_model=MetricsSummary)
async def metrics_summary() -> MetricsSummary:
    """Business metrics summary for dashboards."""
    async with get_db_session() as db:
        total_msgs = (await db.execute(text("SELECT COUNT(*) FROM messages"))).scalar()
        msgs_today = (
            await db.execute(
                text(
                    "SELECT COUNT(*) FROM messages "
                    "WHERE created_at >= NOW() - INTERVAL '24 hours'"
                )
            )
        ).scalar()
        avg_ms = (
            await db.execute(
                text("SELECT COALESCE(AVG(processing_ms), 0) FROM agent_metrics")
            )
        ).scalar()
        escalation_rate = (
            await db.execute(
                text(
                    "SELECT COALESCE(AVG(CASE WHEN was_escalated THEN 1.0 ELSE 0.0 END) * 100, 0) "
                    "FROM agent_metrics"
                )
            )
        ).scalar()
        open_tickets = (
            await db.execute(
                text("SELECT COUNT(*) FROM tickets WHERE status = 'open'")
            )
        ).scalar()
        channels = (
            await db.execute(
                text(
                    "SELECT channel, COUNT(*) as cnt FROM messages "
                    "WHERE direction = 'inbound' GROUP BY channel"
                )
            )
        ).fetchall()

    return MetricsSummary(
        total_messages=int(total_msgs or 0),
        messages_today=int(msgs_today or 0),
        average_processing_ms=round(float(avg_ms or 0), 1),
        escalation_rate_percent=round(float(escalation_rate or 0), 1),
        open_tickets=int(open_tickets or 0),
        channels={row.channel: int(row.cnt) for row in channels},
    )
