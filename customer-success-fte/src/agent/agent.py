"""
src/agent/agent.py
Core AI agent using Groq (via OpenAI-compatible API).
Orchestrates: sentiment check → KB search → response → ticket.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import structlog
from openai import AsyncOpenAI
from textblob import TextBlob

from src.config.settings import get_settings
from src.agent.tools import (
    create_ticket,
    escalate_to_human,
    get_customer_history,
    search_knowledge_base,
    send_response,
)

log = structlog.get_logger(__name__)
settings = get_settings()

# ─── Escalation detection patterns ──────────────────────────────────────────

ESCALATION_KEYWORDS: List[str] = [
    r"\brefund\b",
    r"\bcharge ?back\b",
    r"\blegal\b",
    r"\blawsuit\b",
    r"\battorney\b",
    r"\bfraud\b",
    r"\bscam\b",
    r"\bpric(e|ing) negotiat\w*",
    r"\btalk to (a |the )?(human|person|agent|manager|supervisor)\b",
    r"\bspeak (with|to) (a |the )?(human|person|agent|manager|supervisor)\b",
    r"\bunnacceptable\b",
    r"\bunacceptable\b",
    r"\bhighly disappointed\b",
    r"\bcancell?ation\b",
]
ESCALATION_PATTERN = re.compile("|".join(ESCALATION_KEYWORDS), re.IGNORECASE)

# ─── Channel-specific response constraints ───────────────────────────────────

CHANNEL_GUIDELINES: Dict[str, str] = {
    "email": (
        "You are writing a FORMAL email reply. "
        "Use professional language, proper salutation and sign-off. "
        "Maximum 500 words. Do NOT use emojis."
    ),
    "whatsapp": (
        "You are writing a WhatsApp message. "
        "Be SHORT and conversational. "
        "Preferred length: 1-3 sentences (160-300 characters). "
        "You may use 1-2 relevant emojis."
    ),
    "webform": (
        "You are writing a web chat response. "
        "Be semi-formal, clear, and helpful. "
        "Maximum 300 words. "
        "Use bullet points for step-by-step instructions."
    ),
}

SYSTEM_PROMPT = """
You are ARIA (Autonomous Response & Intelligence Agent), 24/7 AI Customer Success Employee.

Your personality: Professional, warm, solution-focused, always honest about limitations.

Your process for EVERY message:
1. Call get_customer_history to understand who this customer is.
2. Call search_knowledge_base to find relevant product documentation.
3. Decide: escalate or resolve?
4. If escalating: call escalate_to_human, then call send_response with a warm handoff.
5. If resolving: call send_response with helpful answer from KB.
6. Always call create_ticket to log the interaction.

ESCALATION CRITERIA — escalate if ANY true:
- Customer requests refund or chargeback
- Customer mentions legal action, lawyers, fraud
- Customer explicitly asks for a human agent
- Sentiment is strongly negative (anger/threats)
- Pricing negotiation
- KB returns no results and you are unsure

CHANNEL FORMATTING: {channel_guidelines}

CRITICAL RULES:
- Never fabricate product features or pricing.
- Never promise refunds/credits — escalate those.
- If KB empty, say so honestly and escalate.
"""

# ─── Tool definitions for Groq function calling ──────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "Search the product knowledge base using semantic similarity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The customer's question."}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_ticket",
            "description": "Create a support ticket for the customer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string"},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                    "category": {"type": "string", "enum": ["billing", "technical", "feature", "general"]},
                    "conversation_id": {"type": "string"},
                },
                "required": ["customer_id", "title", "description"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_history",
            "description": "Retrieve recent message history for a customer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string"},
                    "limit": {"type": "integer", "default": 10},
                },
                "required": ["customer_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_response",
            "description": "Send a response to the customer via the appropriate channel.",
            "parameters": {
                "type": "object",
                "properties": {
                    "channel": {"type": "string", "enum": ["email", "whatsapp", "webform"]},
                    "recipient": {"type": "string"},
                    "message_text": {"type": "string"},
                    "conversation_id": {"type": "string"},
                },
                "required": ["channel", "recipient", "message_text", "conversation_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": "Escalate a ticket to a human customer success agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticket_id": {"type": "string"},
                    "reason": {"type": "string"},
                    "customer_id": {"type": "string"},
                    "channel": {"type": "string"},
                },
                "required": ["ticket_id", "reason", "customer_id", "channel"],
            },
        },
    },
]

# ─── Tool dispatcher ─────────────────────────────────────────────────────────

TOOL_FUNCTIONS = {
    "search_knowledge_base": search_knowledge_base,
    "create_ticket": create_ticket,
    "get_customer_history": get_customer_history,
    "send_response": send_response,
    "escalate_to_human": escalate_to_human,
}


async def _dispatch_tool(name: str, args: Dict[str, Any]) -> str:
    """Call the Python tool function and return result as JSON string."""
    fn = TOOL_FUNCTIONS.get(name)
    if not fn:
        return json.dumps({"error": f"Unknown tool: {name}"})
    # tools.py functions are plain async functions (not SDK-decorated anymore)
    result = await fn(**args)
    # they already return JSON strings
    return result if isinstance(result, str) else json.dumps(result)


# ─── Message Event Dataclass ─────────────────────────────────────────────────

@dataclass
class MessageEvent:
    """Normalized incoming message from any channel."""

    channel: str                    # email | whatsapp | webform
    sender_id: str                  # email / phone / session_id
    content: str                    # raw message text
    channel_thread_id: str = ""
    customer_id: Optional[str] = None
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    received_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# ─── Sentiment analysis ──────────────────────────────────────────────────────

def analyze_sentiment(text: str) -> float:
    try:
        return round(TextBlob(text).sentiment.polarity, 4)
    except Exception:
        return 0.0


def needs_escalation(content: str, sentiment: float) -> bool:
    if ESCALATION_PATTERN.search(content):
        return True
    if sentiment < settings.escalation_sentiment_threshold:
        return True
    return False


# ─── Main agent runner ───────────────────────────────────────────────────────

async def run_agent(event: MessageEvent) -> Dict[str, Any]:
    """
    Process a single MessageEvent through the Groq AI agent.
    Uses Groq's OpenAI-compatible API with function calling (tool use).
    """
    start_time = datetime.now(timezone.utc)
    sentiment = analyze_sentiment(event.content)

    log.info("Agent run starting", channel=event.channel, sentiment=sentiment)

    client = AsyncOpenAI(
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
    )

    channel_guidelines = CHANNEL_GUIDELINES.get(event.channel, CHANNEL_GUIDELINES["webform"])
    system_prompt = SYSTEM_PROMPT.format(channel_guidelines=channel_guidelines)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": _build_user_message(event, sentiment)},
    ]

    try:
        # Agentic loop: up to 8 turns
        for _turn in range(8):
            response = await client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=settings.agent_temperature,
                max_tokens=settings.agent_max_tokens,
            )

            msg = response.choices[0].message

            # No tool calls → agent is done
            if not msg.tool_calls:
                final_output = msg.content or ""
                break

            # Append assistant message with tool calls
            messages.append({"role": "assistant", "content": msg.content, "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in msg.tool_calls
            ]})

            # Execute all tool calls and append results
            for tc in msg.tool_calls:
                args = json.loads(tc.function.arguments)
                tool_result = await _dispatch_tool(tc.function.name, args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": tool_result,
                })
        else:
            final_output = "Max turns reached."

        processing_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        log.info("Agent run complete", processing_ms=processing_ms)

        return {
            "success": True,
            "processing_ms": processing_ms,
            "agent_output": final_output,
            "sentiment": sentiment,
            "was_escalated": needs_escalation(event.content, sentiment),
        }

    except Exception as exc:
        log.error("Agent run failed", error=str(exc))
        return {"success": False, "error": str(exc), "sentiment": sentiment, "was_escalated": False}


def _build_user_message(event: MessageEvent, sentiment: float) -> str:
    lines = [
        f"CHANNEL: {event.channel}",
        f"CUSTOMER IDENTIFIER: {event.sender_id}",
    ]
    if event.customer_id:
        lines.append(f"CUSTOMER ID: {event.customer_id}")
    if event.conversation_id:
        lines.append(f"CONVERSATION ID: {event.conversation_id}")
    if event.channel_thread_id:
        lines.append(f"THREAD ID: {event.channel_thread_id}")
    lines += [
        f"MESSAGE SENTIMENT: {sentiment:.2f}",
        f"RECEIVED AT: {event.received_at.isoformat()}",
        "",
        "CUSTOMER MESSAGE:",
        event.content,
    ]
    return "\n".join(lines)
