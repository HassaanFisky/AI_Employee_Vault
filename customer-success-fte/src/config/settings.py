"""
src/config/settings.py
Application settings loaded from environment variables via Pydantic Settings.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Groq (Chat LLM) ──────────────────────────────────────────────────
    groq_api_key: str = Field(..., description="Groq API key")
    groq_model: str = Field("llama3-70b-8192", description="Chat model")
    groq_base_url: str = Field("https://api.groq.com/openai/v1")

    # ── OpenAI (Embeddings) ──────────────────────────────────────────────
    openai_api_key: Optional[str] = Field(None, description="OpenAI API key (required for embeddings)")
    openai_embedding_model: str = Field(
        "text-embedding-3-small", description="Embedding model"
    )


    # ── Database ────────────────────────────────────────────────────────────
    database_url: str = Field(..., description="Async SQLAlchemy database URL")
    database_url_sync: str = Field(..., description="Sync psycopg2 URL for Alembic")
    database_pool_size: int = Field(20, ge=1, le=100)
    database_max_overflow: int = Field(10, ge=0, le=50)

    # ── Redis ───────────────────────────────────────────────────────────────
    redis_url: str = Field(..., description="Redis connection URL")
    redis_queue_incoming: str = Field("customer_messages_incoming")
    redis_queue_outgoing: str = Field("customer_messages_outgoing")
    redis_queue_deadletter: str = Field("customer_messages_deadletter")

    # ── Gmail ───────────────────────────────────────────────────────────────
    gmail_credentials_path: str = Field("/app/secrets/gmail_credentials.json", description="Path to Gmail OAuth credentials JSON file")
    gmail_token_path: str = Field("/app/secrets/gmail_token.json", description="Path to Gmail OAuth token JSON file (auto-generated)")
    gmail_scopes: str = Field("https://www.googleapis.com/auth/gmail.modify")
    gmail_poll_interval_seconds: int = Field(30, ge=5, le=300)
    gmail_delegated_user: str = Field("support@yourcompany.com")

    # ── Twilio ──────────────────────────────────────────────────────────────
    twilio_account_sid: str = Field("ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    twilio_auth_token: str = Field("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    twilio_whatsapp_number: str = Field("whatsapp:+14155238886")
    twilio_webhook_secret: str = Field("webhook_secret")

    # ── FastAPI ─────────────────────────────────────────────────────────────
    api_host: str = Field("0.0.0.0")
    api_port: int = Field(8000)
    api_workers: int = Field(4, ge=1, le=32, description="Uvicorn worker processes")
    api_secret_key: str = Field("change_me_in_production")
    cors_origins: str = Field("http://localhost:3000")
    rate_limit_per_minute: int = Field(60)

    # ── Agent ───────────────────────────────────────────────────────────────
    agent_max_tokens: int = Field(2000)
    agent_temperature: float = Field(0.3, ge=0.0, le=2.0)
    kb_similarity_threshold: float = Field(0.75, ge=0.0, le=1.0)
    kb_max_results: int = Field(5, ge=1, le=20)
    escalation_sentiment_threshold: float = Field(-0.6, ge=-1.0, le=0.0)
    max_processing_seconds: int = Field(10, ge=1, le=60)

    # ── Monitoring ──────────────────────────────────────────────────────────
    prometheus_port: int = Field(9090)
    log_level: str = Field("INFO")
    environment: str = Field("development")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        return v  # kept as string; parsed into list property below

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()
