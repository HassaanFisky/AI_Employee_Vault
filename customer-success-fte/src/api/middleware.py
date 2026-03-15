"""
src/api/middleware.py
CORS, request logging, rate limiting, and Prometheus middleware.
"""
from __future__ import annotations

import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from src.config.settings import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()

# ─── Prometheus metrics ───────────────────────────────────────────────────────

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status_code"],
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

MESSAGE_PROCESSING = Counter(
    "agent_messages_processed_total",
    "Total messages processed by channel",
    ["channel"],
)

ESCALATION_COUNT = Counter(
    "agent_escalations_total",
    "Total escalations triggered",
    ["channel"],
)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with timing and correlation ID."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        # Bind request ID to all log calls in this request
        structlog.contextvars.bind_contextvars(request_id=request_id)

        log.info(
            "Request started",
            method=request.method,
            path=request.url.path,
        )

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start

            # Record Prometheus metrics
            REQUEST_COUNT.labels(
                method=request.method,
                path=request.url.path,
                status_code=str(response.status_code),
            ).inc()
            REQUEST_DURATION.labels(
                method=request.method,
                path=request.url.path,
            ).observe(duration)

            log.info(
                "Request complete",
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                duration_ms=round(duration * 1000, 1),
            )
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            structlog.contextvars.clear_contextvars()


def setup_cors(app) -> None:
    """Add CORS middleware with config-driven origins."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
