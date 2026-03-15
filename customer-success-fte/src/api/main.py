"""
src/api/main.py
FastAPI application entrypoint with lifespan management.
Starts Gmail polling thread, initializes DB, Kafka, and mounts all routers.
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import start_http_server

from src.api.middleware import LoggingMiddleware, setup_cors
from src.api.routes.health import router as health_router
from src.api.routes.webform import router as webform_router
from src.api.routes.whatsapp import router as whatsapp_router
from src.config.settings import get_settings
from src.database.connection import close_engine, init_engine
from src.workers.redis_producer import get_producer

log = structlog.get_logger(__name__)
settings = get_settings()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
        if not settings.is_production
        else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        getattr(__import__("logging"), settings.log_level)
    ),
)

_gmail_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle."""
    log.info("Starting Customer Success FTE", env=settings.environment)

    # 1. Initialize database connection pool
    init_engine()
    log.info("Database pool initialized")

    # 2. Redis Producer Warmup & Check
    try:
        prod = get_producer()
        await prod.redis.ping()
        log.info("Redis initialized")
    except Exception as exc:
        log.error("Redis init failed", error=str(exc))

    # 3. Start Gmail polling loop in background
    global _gmail_task
    try:
        from src.channels.gmail_handler import gmail_polling_loop
        producer = get_producer()
        _gmail_task = asyncio.create_task(
            gmail_polling_loop(producer.publish_message),
            name="gmail-polling",
        )
        log.info("Gmail polling started")
    except Exception as exc:
        log.warning("Gmail polling disabled", reason=str(exc))

    yield  # app is now serving

    # ── Shutdown ──────────────────────────────────────────────────────────
    if _gmail_task and not _gmail_task.done():
        _gmail_task.cancel()
        try:
            await _gmail_task
        except asyncio.CancelledError:
            pass

    await get_producer().close()
    await close_engine()
    log.info("Shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Customer Success Digital FTE",
        description=(
            "24/7 AI Customer Success Employee — handles support across "
            "Gmail, WhatsApp, and Web Form using OpenAI Agents."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
    )

    # Middleware (order matters — outermost first)
    setup_cors(app)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Routers
    app.include_router(health_router)
    app.include_router(webform_router)
    app.include_router(whatsapp_router)

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers,
        log_level=settings.log_level.lower(),
        reload=not settings.is_production,
    )
