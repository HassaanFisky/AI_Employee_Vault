"""
src/api/routes/webform.py
Web form chat endpoint and WebSocket handler for real-time replies.
"""
from __future__ import annotations

import asyncio

import structlog
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.schemas import WebFormMessageRequest, WebFormMessageResponse
from src.channels.webform_handler import connection_manager
from src.database.connection import get_db
from src.workers.redis_producer import get_producer

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/support", tags=["Web Form"])


@router.post("/message", response_model=WebFormMessageResponse)
async def receive_web_message(
    body: WebFormMessageRequest,
    db: AsyncSession = Depends(get_db),
) -> WebFormMessageResponse:
    """
    Accept a message from the web support widget.
    Publishes to Kafka — actual AI response comes back via WebSocket.
    """
    producer = get_producer()
    event_id = await producer.publish_message(
        channel="webform",
        sender_id=body.session_id,
        content=body.message,
        metadata={
            "customer_email": body.customer_email,
            "customer_name": body.customer_name,
        },
    )
    log.info("Web form message published", event_id=event_id, session=body.session_id[:8])
    return WebFormMessageResponse(event_id=event_id)


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(session_id: str, websocket: WebSocket) -> None:
    """
    WebSocket endpoint for the web chat widget.
    Agent responses are pushed here via push_websocket_message().
    """
    await connection_manager.connect(session_id, websocket)
    # Send welcome message
    await connection_manager.broadcast_json(
        session_id,
        {
            "type": "connected",
            "content": "Hi! I'm ARIA, your AI support assistant. How can I help you today? 👋",
        },
    )
    try:
        while True:
            # Keep connection alive; messages arrive via REST POST → Kafka → agent
            data = await websocket.receive_text()
            # Optionally handle ping/pong frames
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await connection_manager.disconnect(session_id, websocket)
