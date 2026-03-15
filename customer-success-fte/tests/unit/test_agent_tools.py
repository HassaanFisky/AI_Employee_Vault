"""
tests/unit/test_agent_tools.py
Unit tests for all five AI agent tools.
Mocks all external dependencies (OpenAI API, database, Twilio).
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ─── test search_knowledge_base ──────────────────────────────────────────────

class TestSearchKnowledgeBase:
    @pytest.mark.asyncio
    async def test_returns_matching_articles(self):
        fake_embedding = [0.1] * 1536
        fake_row = MagicMock()
        fake_row.id = uuid.uuid4()
        fake_row.title = "How to reset your password"
        fake_row.content = "To reset your password, go to Settings > Security."
        fake_row.category = "account"
        fake_row.source_url = "https://docs.example.com/reset-password"
        fake_row.similarity = 0.92

        mock_result = MagicMock()
        mock_result.fetchall.return_value = [fake_row]

        with (
            patch("src.agent.tools.openai.AsyncOpenAI") as mock_openai_cls,
            patch("src.agent.tools.get_db_session") as mock_session,
        ):
            # Mock embedding call
            mock_client = AsyncMock()
            mock_openai_cls.return_value = mock_client
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=fake_embedding)]
            mock_client.embeddings.create = AsyncMock(return_value=mock_response)

            # Mock DB session
            mock_db = AsyncMock()
            mock_db.execute = AsyncMock(return_value=mock_result)
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=None)

            from src.agent.tools import search_knowledge_base
            result_raw = await search_knowledge_base.on_invoke_tool(
                None, json.dumps({"query": "how do I reset my password"})
            )
            result = json.loads(result_raw)

        assert result["count"] == 1
        assert result["results"][0]["title"] == "How to reset your password"
        assert result["results"][0]["similarity"] == 0.92

    @pytest.mark.asyncio
    async def test_returns_empty_when_below_threshold(self):
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []

        with (
            patch("src.agent.tools.openai.AsyncOpenAI") as mock_openai_cls,
            patch("src.agent.tools.get_db_session") as mock_session,
        ):
            mock_client = AsyncMock()
            mock_openai_cls.return_value = mock_client
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.0] * 1536)]
            mock_client.embeddings.create = AsyncMock(return_value=mock_response)

            mock_db = AsyncMock()
            mock_db.execute = AsyncMock(return_value=mock_result)
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=None)

            from src.agent.tools import search_knowledge_base
            result_raw = await search_knowledge_base.on_invoke_tool(
                None, json.dumps({"query": "obscure unrelated topic"})
            )
            result = json.loads(result_raw)

        assert result["count"] == 0
        assert len(result["results"]) == 0


# ─── test create_ticket ───────────────────────────────────────────────────────

class TestCreateTicket:
    @pytest.mark.asyncio
    async def test_creates_ticket_successfully(self):
        customer_id = str(uuid.uuid4())
        mock_db = AsyncMock()
        mock_db.flush = AsyncMock()

        with patch("src.agent.tools.get_db_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=None)

            from src.agent.tools import create_ticket
            result_raw = await create_ticket.on_invoke_tool(
                None,
                json.dumps({
                    "customer_id": customer_id,
                    "title": "Login not working",
                    "description": "I cannot log in after the update.",
                    "priority": "high",
                    "category": "technical",
                }),
            )
            result = json.loads(result_raw)

        assert "ticket_id" in result
        assert result["priority"] == "high"
        assert result["status"] == "open"

    @pytest.mark.asyncio
    async def test_sanitizes_invalid_priority(self):
        customer_id = str(uuid.uuid4())
        mock_db = AsyncMock()
        mock_db.flush = AsyncMock()

        with patch("src.agent.tools.get_db_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=None)

            from src.agent.tools import create_ticket
            result_raw = await create_ticket.on_invoke_tool(
                None,
                json.dumps({
                    "customer_id": customer_id,
                    "title": "Test ticket",
                    "description": "desc",
                    "priority": "URGENT",  # invalid — should fall back to medium
                }),
            )
            result = json.loads(result_raw)

        assert result["priority"] == "medium"


# ─── test get_customer_history ────────────────────────────────────────────────

class TestGetCustomerHistory:
    @pytest.mark.asyncio
    async def test_returns_customer_profile_and_messages(self):
        from src.database.models import Customer, Message

        cid = uuid.uuid4()
        fake_customer = Customer(
            id=cid,
            full_name="Alice Johnson",
            company="Acme Corp",
            plan="pro",
            status="active",
            sentiment_score=0.4,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        fake_message = Message(
            id=uuid.uuid4(),
            conversation_id=uuid.uuid4(),
            customer_id=cid,
            direction="inbound",
            channel="email",
            content="My invoice is wrong.",
            created_at=datetime.now(timezone.utc),
        )

        mock_cust_result = MagicMock()
        mock_cust_result.scalar_one_or_none.return_value = fake_customer
        mock_msg_result = MagicMock()
        mock_msg_result.scalars.return_value.all.return_value = [fake_message]
        mock_tkt_result = MagicMock()
        mock_tkt_result.scalars.return_value.all.return_value = []

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(
            side_effect=[mock_cust_result, mock_msg_result, mock_tkt_result]
        )

        with patch("src.agent.tools.get_db_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=None)

            from src.agent.tools import get_customer_history
            result_raw = await get_customer_history.on_invoke_tool(
                None, json.dumps({"customer_id": str(cid), "limit": 5})
            )
            result = json.loads(result_raw)

        assert result["customer"]["name"] == "Alice Johnson"
        assert result["customer"]["plan"] == "pro"
        assert len(result["recent_messages"]) == 1
        assert result["open_tickets_count"] == 0


# ─── test escalate_to_human ───────────────────────────────────────────────────

class TestEscalateToHuman:
    @pytest.mark.asyncio
    async def test_escalates_ticket(self):
        from src.database.models import Ticket

        tid = uuid.uuid4()
        cid = uuid.uuid4()
        fake_ticket = Ticket(
            id=tid,
            customer_id=cid,
            title="Refund request",
            priority="high",
            status="open",
            is_escalated=False,
        )
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = fake_ticket

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch("src.agent.tools.get_db_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=None)

            from src.agent.tools import escalate_to_human
            result_raw = await escalate_to_human.on_invoke_tool(
                None,
                json.dumps({
                    "ticket_id": str(tid),
                    "reason": "Customer requesting full refund",
                    "customer_id": str(cid),
                    "channel": "email",
                }),
            )
            result = json.loads(result_raw)

        assert result["escalated"] is True
        assert fake_ticket.is_escalated is True
        assert fake_ticket.status == "in_progress"


# ─── test agent sentiment analysis ───────────────────────────────────────────

class TestSentimentAndEscalation:
    def test_analyze_sentiment_positive(self):
        from src.agent.agent import analyze_sentiment
        score = analyze_sentiment("This product is amazing! Really love it!")
        assert score > 0.0

    def test_analyze_sentiment_negative(self):
        from src.agent.agent import analyze_sentiment
        score = analyze_sentiment("I am furious! This is terrible and completely broken!")
        assert score < 0.0

    def test_needs_escalation_keyword(self):
        from src.agent.agent import needs_escalation
        assert needs_escalation("I want to speak to a human agent", 0.0) is True

    def test_needs_escalation_refund(self):
        from src.agent.agent import needs_escalation
        assert needs_escalation("I need a refund immediately", 0.0) is True

    def test_needs_escalation_negative_sentiment(self):
        from src.agent.agent import needs_escalation
        assert needs_escalation("The product works fine", -0.9) is True

    def test_no_escalation_for_normal_message(self):
        from src.agent.agent import needs_escalation
        assert needs_escalation("How do I export my data?", 0.1) is False
