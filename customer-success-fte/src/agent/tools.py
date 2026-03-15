"""
src/agent/tools.py
All five agent tools used by the OpenAI Agents SDK runner.
Each tool is a plain async function decorated with @function_tool.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import structlog
from sqlalchemy import select, text

from src.config.settings import get_settings
from src.database.connection import get_db_session
from src.database.models import (
    AgentMetric,
    Conversation,
    Customer,
    CustomerIdentifier,
    KnowledgeBase,
    Message,
    Ticket,
)

log = structlog.get_logger(__name__)
settings = get_settings()


# ─── Tool: search_knowledge_base ────────────────────────────────────────────


async def search_knowledge_base(query: str) -> str:
    """
    Search the product knowledge base using semantic similarity.

    Args:
        query: The customer's question or topic to search for.

    Returns:
        JSON string with matching knowledge base articles.
    """
    import openai

    if not settings.openai_api_key:
        return json.dumps({"error": "OpenAI API key missing for embeddings search."})

    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    # Generate query embedding
    response = await client.embeddings.create(
        model=settings.openai_embedding_model,
        input=query,
    )
    query_embedding = response.data[0].embedding

    async with get_db_session() as db:
        # pgvector cosine similarity search
        result = await db.execute(
            text(
                """
                SELECT id, title, content, category, source_url,
                       1 - (embedding <=> :embedding::vector) AS similarity
                FROM knowledge_base
                WHERE is_active = TRUE
                  AND 1 - (embedding <=> :embedding::vector) >= :threshold
                ORDER BY embedding <=> :embedding::vector
                LIMIT :limit
                """
            ),
            {
                "embedding": str(query_embedding),
                "threshold": settings.kb_similarity_threshold,
                "limit": settings.kb_max_results,
            },
        )
        rows = result.fetchall()

        articles = [
            {
                "id": str(row.id),
                "title": row.title,
                "content": row.content[:800],  # truncate for context window
                "category": row.category,
                "source_url": row.source_url,
                "similarity": round(row.similarity, 4),
            }
            for row in rows
        ]

        # Increment view counts
        if rows:
            ids = [str(row.id) for row in rows]
            await db.execute(
                text(
                    "UPDATE knowledge_base SET view_count = view_count + 1 "
                    "WHERE id = ANY(:ids::uuid[])"
                ),
                {"ids": ids},
            )

    log.info("KB search complete", query=query[:50], hits=len(articles))
    return json.dumps({"results": articles, "count": len(articles)})


# ─── Tool: create_ticket ────────────────────────────────────────────────────


async def create_ticket(
    customer_id: str,
    title: str,
    description: str,
    priority: str = "medium",
    category: str = "general",
    conversation_id: Optional[str] = None,
) -> str:
    """
    Create a support ticket for the customer.

    Args:
        customer_id: UUID of the customer.
        title: Short summary of the issue (max 500 chars).
        description: Full description of the issue.
        priority: low | medium | high | critical.
        category: billing | technical | feature | general.
        conversation_id: Optional UUID of the related conversation.

    Returns:
        JSON with the created ticket ID and details.
    """
    valid_priorities = {"low", "medium", "high", "critical"}
    if priority not in valid_priorities:
        priority = "medium"

    valid_categories = {"billing", "technical", "feature", "general"}
    if category not in valid_categories:
        category = "general"

    async with get_db_session() as db:
        ticket = Ticket(
            id=uuid.uuid4(),
            customer_id=uuid.UUID(customer_id),
            conversation_id=uuid.UUID(conversation_id) if conversation_id else None,
            title=title[:500],
            description=description,
            priority=priority,
            category=category,
            status="open",
            is_escalated=False,
        )
        db.add(ticket)
        await db.flush()  # get the ID without full commit
        ticket_id = str(ticket.id)

    log.info("Ticket created", ticket_id=ticket_id, priority=priority)
    return json.dumps(
        {
            "ticket_id": ticket_id,
            "title": title,
            "priority": priority,
            "category": category,
            "status": "open",
        }
    )


# ─── Tool: get_customer_history ─────────────────────────────────────────────


async def get_customer_history(customer_id: str, limit: int = 10) -> str:
    """
    Retrieve recent message history for a customer across all channels.

    Args:
        customer_id: UUID of the customer.
        limit: Number of recent messages to retrieve (max 20).

    Returns:
        JSON with recent messages and customer profile.
    """
    limit = min(limit, 20)

    async with get_db_session() as db:
        # Customer profile
        cust_result = await db.execute(
            select(Customer).where(Customer.id == uuid.UUID(customer_id))
        )
        customer = cust_result.scalar_one_or_none()
        if not customer:
            return json.dumps({"error": f"Customer {customer_id} not found"})

        # Recent messages
        msg_result = await db.execute(
            select(Message)
            .where(Message.customer_id == uuid.UUID(customer_id))
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = msg_result.scalars().all()

        # Open tickets count
        tkt_result = await db.execute(
            select(Ticket).where(
                Ticket.customer_id == uuid.UUID(customer_id),
                Ticket.status == "open",
            )
        )
        open_tickets = tkt_result.scalars().all()

    history = {
        "customer": {
            "id": str(customer.id),
            "name": customer.full_name,
            "company": customer.company,
            "plan": customer.plan,
            "status": customer.status,
            "sentiment_score": customer.sentiment_score,
        },
        "open_tickets_count": len(open_tickets),
        "recent_messages": [
            {
                "direction": msg.direction,
                "channel": msg.channel,
                "content": msg.content[:300],
                "timestamp": msg.created_at.isoformat(),
            }
            for msg in reversed(messages)  # chronological order
        ],
    }
    return json.dumps(history)


# ─── Tool: send_response ────────────────────────────────────────────────────


async def send_response(
    channel: str,
    recipient: str,
    message_text: str,
    conversation_id: str,
) -> str:
    """
    Send a response to the customer via the appropriate channel.

    Args:
        channel: email | whatsapp | webform
        recipient: Email address, WhatsApp number (+1234...), or session ID.
        message_text: The drafted response to send.
        conversation_id: UUID of the conversation for record-keeping.

    Returns:
        JSON with delivery status.
    """
    channel = channel.lower().strip()

    if channel == "email":
        status = await _send_email_response(recipient, message_text, conversation_id)
    elif channel == "whatsapp":
        status = await _send_whatsapp_response(recipient, message_text)
    elif channel == "webform":
        # Push to WebSocket; handled by the connection manager
        from src.channels.webform_handler import push_websocket_message
        await push_websocket_message(conversation_id, message_text)
        status = {"delivered": True, "channel": "webform"}
    else:
        return json.dumps({"error": f"Unknown channel: {channel}"})

    log.info(
        "Response sent",
        channel=channel,
        recipient=recipient[:20],
        delivered=status.get("delivered"),
    )
    return json.dumps(status)


async def _send_email_response(recipient: str, body: str, thread_id: str) -> Dict[str, Any]:
    """Reply to a Gmail thread."""
    try:
        from src.channels.gmail_handler import GmailHandler
        handler = GmailHandler()
        message_id = await handler.send_reply(recipient, body, thread_id)
        return {"delivered": True, "channel": "email", "message_id": message_id}
    except Exception as exc:
        log.error("Email send failed", error=str(exc))
        return {"delivered": False, "channel": "email", "error": str(exc)}


async def _send_whatsapp_response(to_number: str, body: str) -> Dict[str, Any]:
    """Send a WhatsApp message via Twilio."""
    try:
        from src.channels.whatsapp_handler import WhatsAppHandler
        handler = WhatsAppHandler()
        sid = await handler.send_message(to_number, body)
        return {"delivered": True, "channel": "whatsapp", "sid": sid}
    except Exception as exc:
        log.error("WhatsApp send failed", error=str(exc))
        return {"delivered": False, "channel": "whatsapp", "error": str(exc)}


# ─── Tool: escalate_to_human ────────────────────────────────────────────────


async def escalate_to_human(
    ticket_id: str,
    reason: str,
    customer_id: str,
    channel: str,
) -> str:
    """
    Escalate a ticket to a human customer success agent.

    Args:
        ticket_id: UUID of the ticket to escalate.
        reason: Why escalation is needed (displayed to the human agent).
        customer_id: UUID of the customer.
        channel: The original contact channel.

    Returns:
        JSON confirmation of escalation.
    """
    async with get_db_session() as db:
        tkt_result = await db.execute(
            select(Ticket).where(Ticket.id == uuid.UUID(ticket_id))
        )
        ticket = tkt_result.scalar_one_or_none()

        if not ticket:
            return json.dumps({"error": f"Ticket {ticket_id} not found"})

        ticket.is_escalated = True
        ticket.escalation_reason = reason
        ticket.status = "in_progress"
        ticket.assigned_to = "support-team@yourcompany.com"

    # TODO: In production, fire a webhook / PagerDuty / Slack notification here
    log.warning(
        "Ticket escalated",
        ticket_id=ticket_id,
        reason=reason[:100],
        channel=channel,
    )

    return json.dumps(
        {
            "escalated": True,
            "ticket_id": ticket_id,
            "assigned_to": "support-team@yourcompany.com",
            "reason": reason,
            "message_to_customer": (
                "I've escalated your case to a senior support specialist "
                "who will reach out within 1 business hour."
            ),
        }
    )
