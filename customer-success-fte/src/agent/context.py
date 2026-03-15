"""
src/agent/context.py
Customer identification and context resolution.
Resolves a raw sender identifier to a Customer record (or creates one).
"""
from __future__ import annotations

import uuid
from typing import Optional, Tuple

import structlog
from sqlalchemy import select

from src.database.connection import get_db_session
from src.database.models import Conversation, Customer, CustomerIdentifier, Message
from src.agent.agent import MessageEvent

log = structlog.get_logger(__name__)


async def resolve_customer(
    channel: str, identifier: str
) -> Tuple[Customer, bool]:
    """
    Look up or create a Customer by their channel identifier.

    Returns:
        (customer, is_new) — is_new is True if we just created the record.
    """
    async with get_db_session() as db:
        # Try to find existing identifier
        result = await db.execute(
            select(CustomerIdentifier)
            .where(
                CustomerIdentifier.channel == channel,
                CustomerIdentifier.identifier == identifier,
            )
        )
        existing_ident = result.scalar_one_or_none()

        if existing_ident:
            cust_result = await db.execute(
                select(Customer).where(Customer.id == existing_ident.customer_id)
            )
            customer = cust_result.scalar_one()
            log.info("Customer resolved", customer_id=str(customer.id), channel=channel)
            return customer, False

        # Create new customer + identifier
        customer = Customer(
            id=uuid.uuid4(),
            full_name=None,
            plan="free",
            status="active",
            sentiment_score=0.0,
        )
        db.add(customer)
        await db.flush()

        ident = CustomerIdentifier(
            id=uuid.uuid4(),
            customer_id=customer.id,
            channel=channel,
            identifier=identifier,
            is_verified=False,
        )
        db.add(ident)

        log.info("New customer created", customer_id=str(customer.id), channel=channel)
        return customer, True


async def get_or_create_conversation(
    customer_id: uuid.UUID,
    channel: str,
    channel_thread_id: Optional[str],
    subject: Optional[str] = None,
) -> Conversation:
    """
    Return the most recent open conversation for this thread, or create one.
    """
    async with get_db_session() as db:
        if channel_thread_id:
            result = await db.execute(
                select(Conversation).where(
                    Conversation.channel_thread_id == channel_thread_id,
                    Conversation.status == "open",
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                return existing

        conversation = Conversation(
            id=uuid.uuid4(),
            customer_id=customer_id,
            channel=channel,
            channel_thread_id=channel_thread_id,
            subject=subject,
            status="open",
        )
        db.add(conversation)

    return conversation


async def persist_inbound_message(
    event: MessageEvent,
    sentiment: float,
) -> Message:
    """Save the inbound message to the database."""
    async with get_db_session() as db:
        msg = Message(
            id=uuid.uuid4(),
            conversation_id=uuid.UUID(event.conversation_id),
            customer_id=uuid.UUID(event.customer_id),
            direction="inbound",
            channel=event.channel,
            content=event.content,
            sender_id=event.sender_id,
            message_metadata=event.metadata,
            sentiment=sentiment,
            processed_at=None,  # updated after agent completes
        )
        db.add(msg)
        return msg


async def hydrate_event(event: MessageEvent) -> MessageEvent:
    """
    Fully resolve a MessageEvent:
    - Identify/create customer
    - Get/create conversation
    - Persist inbound message
    - Attach IDs back to event
    """
    from src.agent.agent import analyze_sentiment

    # 1. Resolve customer
    customer, _ = await resolve_customer(event.channel, event.sender_id)
    event.customer_id = str(customer.id)

    # 2. Resolve conversation
    conversation = await get_or_create_conversation(
        customer_id=customer.id,
        channel=event.channel,
        channel_thread_id=event.channel_thread_id or None,
        subject=event.metadata.get("subject"),
    )
    event.conversation_id = str(conversation.id)

    # 3. For webform, the agent's send_response tool receives conversation_id
    #    but the WebSocket is registered under session_id (= event.sender_id).
    #    Register the mapping so push_websocket_message can route correctly.
    if event.channel == "webform":
        from src.channels.webform_handler import register_session_conversation
        register_session_conversation(
            session_id=event.sender_id,
            conversation_id=event.conversation_id,
        )

    # 4. Persist inbound message
    sentiment = analyze_sentiment(event.content)
    msg = await persist_inbound_message(event, sentiment)
    event.message_id = str(msg.id)

    return event

