"""
src/channels/webform_handler.py
Web form channel — manages WebSocket connections for real-time bidirectional
communication. The WebSocket is keyed by session_id (supplied by the frontend).
The agent's send_response tool uses session_id as the routing key, not conversation_id.
"""
from __future__ import annotations

import json
from collections import defaultdict
from typing import Dict, List, Set

import structlog
from fastapi import WebSocket

log = structlog.get_logger(__name__)

# Global connection registry: session_id → set of WebSocket connections
_active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)

# session_id → conversation_id mapping  (populated by context.py during hydration)
# This allows the agent tool (which knows conversation_id) to look up the session_id
_session_by_conversation: Dict[str, str] = {}


class ConnectionManager:
    """Manages active WebSocket connections for the web chat widget."""

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        _active_connections[session_id].add(websocket)
        log.info("WebSocket connected", session_id=session_id[:8])

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        _active_connections[session_id].discard(websocket)
        if not _active_connections[session_id]:
            _active_connections.pop(session_id, None)
        log.info("WebSocket disconnected", session_id=session_id[:8])

    async def send_text(self, session_id: str, message: str) -> None:
        """Send a message to all WebSocket connections for a session."""
        sockets = list(_active_connections.get(session_id, []))
        dead: List[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            _active_connections[session_id].discard(ws)

    async def broadcast_json(self, session_id: str, data: dict) -> None:
        await self.send_text(session_id, json.dumps(data))


# Singleton manager
connection_manager = ConnectionManager()


def register_session_conversation(session_id: str, conversation_id: str) -> None:
    """
    Register the mapping from conversation_id → session_id.
    Called from context.py after a conversation is resolved/created so that
    the agent's send_response tool can look up the correct WebSocket.
    """
    _session_by_conversation[str(conversation_id)] = session_id


async def push_websocket_message(conversation_id: str, text: str) -> None:
    """
    Push an AI response to the web chat widget.
    Called from the send_response agent tool.

    The agent passes conversation_id; we look up the session_id that owns
    the WebSocket connection (registered during event hydration).
    """
    # First try conversation_id as a direct session_id (fallback for tests)
    direct_key = str(conversation_id)
    session_id = _session_by_conversation.get(direct_key, direct_key)

    if session_id not in _active_connections or not _active_connections[session_id]:
        log.warning(
            "No active WebSocket for session",
            conversation_id=direct_key[:8],
            resolved_session=session_id[:8],
        )
        return

    await connection_manager.broadcast_json(
        session_id,
        {
            "type": "agent_response",
            "content": text,
        },
    )
    log.info("Pushed response to WebSocket", session_id=session_id[:8])
