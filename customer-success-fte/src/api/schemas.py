"""
src/api/schemas.py
Pydantic request/response models for all FastAPI endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Web Form ────────────────────────────────────────────────────────────────

class WebFormMessageRequest(BaseModel):
    """Incoming message from the web support widget."""
    session_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(..., min_length=1, max_length=4000)
    customer_email: Optional[str] = Field(None, max_length=255)
    customer_name: Optional[str] = Field(None, max_length=255)


class WebFormMessageResponse(BaseModel):
    """Acknowledgement returned immediately after receiving a web form message."""
    event_id: str
    message: str = "Message received. Agent is processing your request."
    conversation_id: Optional[str] = None


# ─── WhatsApp ────────────────────────────────────────────────────────────────

class WhatsAppWebhookResponse(BaseModel):
    """TwiML-compatible empty response (Twilio expects 200 + empty body or TwiML)."""
    status: str = "ok"


# ─── Health & Metrics ────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    environment: str
    timestamp: datetime
    checks: Dict[str, str]


class MetricsSummary(BaseModel):
    total_messages: int
    messages_today: int
    average_processing_ms: float
    escalation_rate_percent: float
    open_tickets: int
    channels: Dict[str, int]


# ─── Ticket ──────────────────────────────────────────────────────────────────

class TicketResponse(BaseModel):
    id: UUID
    title: str
    priority: str
    status: str
    is_escalated: bool
    category: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerResponse(BaseModel):
    id: UUID
    full_name: Optional[str]
    company: Optional[str]
    plan: str
    status: str
    sentiment_score: float
    created_at: datetime

    model_config = {"from_attributes": True}
