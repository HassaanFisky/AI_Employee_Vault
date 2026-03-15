"""
tests/conftest.py
Global pytest fixtures and configuration.
"""
import asyncio
import pytest
from unittest.mock import patch


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    """Override settings for all tests — no real API keys needed."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key-0000000000000000000000000000000")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test_fte")
    monkeypatch.setenv("DATABASE_URL_SYNC", "postgresql://test:test@localhost:5432/test_fte")
    monkeypatch.setenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "ACtest")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "testtoken")
    monkeypatch.setenv("ENVIRONMENT", "testing")

    # Clear settings cache
    from src.config.settings import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
