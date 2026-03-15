"""
tests/integration/test_api_routes.py
Integration tests for all FastAPI endpoints using httpx AsyncClient.
Tests run against actual routes with mocked database/Kafka/agent calls.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest.fixture(scope="module")
def app():
    """Create FastAPI app with mocked dependencies."""
    with (
        patch("src.database.connection.init_engine"),
        patch("src.database.connection.close_engine"),
        patch("src.workers.kafka_producer.ensure_topics_exist"),
        patch("src.workers.kafka_producer.get_producer"),
        patch("src.channels.gmail_handler.gmail_polling_loop"),
    ):
        from src.api.main import create_app
        return create_app()


@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ─── Health endpoints ─────────────────────────────────────────────────────────

class TestHealthEndpoints:
    @pytest.mark.asyncio
    async def test_liveness(self, client):
        response = await client.get("/livez")
        assert response.status_code == 200
        assert response.json() == {"status": "alive"}

    @pytest.mark.asyncio
    async def test_readiness(self, client):
        response = await client.get("/readyz")
        assert response.status_code == 200
        assert response.json() == {"status": "ready"}

    @pytest.mark.asyncio
    async def test_metrics_prometheus(self, client):
        response = await client.get("/metrics")
        assert response.status_code == 200
        assert "http_requests_total" in response.text


# ─── Web Form endpoint ────────────────────────────────────────────────────────

class TestWebFormEndpoint:
    @pytest.mark.asyncio
    async def test_post_message_returns_event_id(self, client):
        mock_producer = AsyncMock()
        mock_producer.publish_message = AsyncMock(return_value="test-event-id-123")

        with patch("src.api.routes.webform.get_producer", return_value=mock_producer):
            response = await client.post(
                "/support/message",
                json={
                    "session_id": str(uuid4()),
                    "message": "Hello, I need help with my account.",
                    "customer_email": "test@example.com",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["event_id"] == "test-event-id-123"
        assert "message" in data

    @pytest.mark.asyncio
    async def test_post_message_empty_content_rejected(self, client):
        response = await client.post(
            "/support/message",
            json={
                "session_id": str(uuid4()),
                "message": "",   # empty — should be rejected
            },
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_post_message_too_long_rejected(self, client):
        response = await client.post(
            "/support/message",
            json={
                "session_id": str(uuid4()),
                "message": "x" * 5000,  # exceeds 4000 char limit
            },
        )
        assert response.status_code == 422


# ─── WhatsApp webhook ─────────────────────────────────────────────────────────

class TestWhatsAppWebhook:
    @pytest.mark.asyncio
    async def test_valid_whatsapp_message_published(self, client):
        mock_producer = AsyncMock()
        mock_producer.publish_message = AsyncMock(return_value="event-wa-123")

        with (
            patch("src.api.routes.whatsapp.get_producer", return_value=mock_producer),
            # Skip signature validation in test (non-production env)
            patch("src.config.settings.Settings.is_production", new_callable=lambda: property(lambda self: False)),
        ):
            response = await client.post(
                "/webhook/whatsapp",
                data={
                    "From": "whatsapp:+12125551234",
                    "To": "whatsapp:+14155238886",
                    "Body": "Hi, I need support with billing.",
                    "MessageSid": "SM123456",
                    "NumMedia": "0",
                    "ProfileName": "John Doe",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_empty_whatsapp_message_ignored(self, client):
        mock_producer = AsyncMock()

        with patch("src.api.routes.whatsapp.get_producer", return_value=mock_producer):
            response = await client.post(
                "/webhook/whatsapp",
                data={
                    "From": "whatsapp:+12125551234",
                    "To": "whatsapp:+14155238886",
                    "Body": "",  # empty body
                    "MessageSid": "SM999",
                    "NumMedia": "0",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        assert response.status_code == 200
        mock_producer.publish_message.assert_not_called()
