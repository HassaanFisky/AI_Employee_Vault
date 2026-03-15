import os
import json
import logging
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Tool registry for agent loop
TOOLS = {}
TOOL_SCHEMAS = []

def tool(schema: dict):
    """Decorator to register a function as an agent tool."""
    def decorator(fn):
        TOOLS[schema["function"]["name"]] = fn
        TOOL_SCHEMAS.append(schema)
        return fn
    return decorator

# --- Tool 1 ---
class KnowledgeSearchInput(BaseModel):
    query: str
    max_results: int = 5

@tool({
    "type": "function",
    "function": {
        "name": "search_knowledge_base",
        "description": "Search product documentation. Use when customer asks about features, how-to, or technical questions.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "max_results": {"type": "integer", "description": "Max results to return", "default": 5}
            },
            "required": ["query"]
        }
    }
})
async def search_knowledge_base(query: str, max_results: int = 5) -> str:
    try:
        from database.queries import get_db_pool
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT title, content FROM knowledge_base WHERE content ILIKE $1 LIMIT $2",
                f"%{query}%", max_results
            )
            if not rows:
                return "No relevant documentation found. Consider escalating to human support."
            return "\n\n---\n\n".join([f"**{r['title']}**\n{r['content'][:500]}" for r in rows])
    except Exception as e:
        logger.error(f"search_knowledge_base error: {e}")
        return "Knowledge base temporarily unavailable. Please escalate if needed."

# --- Tool 2 ---
@tool({
    "type": "function",
    "function": {
        "name": "create_ticket",
        "description": "Create a support ticket. ALWAYS call this first at the start of every conversation.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "issue": {"type": "string"},
                "priority": {"type": "string", "enum": ["low", "medium", "high"], "default": "medium"},
                "category": {"type": "string"},
                "channel": {"type": "string", "enum": ["email", "whatsapp", "web_form"]}
            },
            "required": ["customer_id", "issue", "channel"]
        }
    }
})
async def create_ticket(customer_id: str, issue: str, channel: str,
                        priority: str = "medium", category: str = "general") -> str:
    try:
        from database.queries import get_or_create_conversation, create_ticket_record
        conv_id = await get_or_create_conversation(customer_id, channel)
        ticket_id = await create_ticket_record(customer_id, conv_id, channel, category, priority)
        return f"Ticket created: {ticket_id}"
    except Exception as e:
        logger.error(f"create_ticket error: {e}")
        return f"Ticket creation failed: {str(e)}"

# --- Tool 3 ---
@tool({
    "type": "function",
    "function": {
        "name": "get_customer_history",
        "description": "Get customer interaction history across ALL channels. Call after create_ticket.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"}
            },
            "required": ["customer_id"]
        }
    }
})
async def get_customer_history(customer_id: str) -> str:
    try:
        from database.queries import get_customer_full_history
        history = await get_customer_full_history(customer_id)
        if not history:
            return "No prior interaction history found for this customer."
        lines = [f"[{h['channel']}] {h['role']}: {h['content'][:200]}" for h in history]
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_customer_history error: {e}")
        return "History unavailable."

# --- Tool 4 ---
@tool({
    "type": "function",
    "function": {
        "name": "escalate_to_human",
        "description": "Escalate to human support. Use for pricing, refunds, legal issues, angry customers, or when you cannot help.",
        "parameters": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "string"},
                "reason": {"type": "string"},
                "urgency": {"type": "string", "enum": ["normal", "urgent"], "default": "normal"}
            },
            "required": ["ticket_id", "reason"]
        }
    }
})
async def escalate_to_human(ticket_id: str, reason: str, urgency: str = "normal") -> str:
    try:
        from database.queries import update_ticket_status
        from kafka_client import FTEKafkaProducer, TOPICS
        await update_ticket_status(ticket_id, "escalated", f"Reason: {reason}")
        producer = FTEKafkaProducer()
        await producer.start()
        await producer.publish(TOPICS['escalations'], {
            "ticket_id": ticket_id, "reason": reason, "urgency": urgency
        })
        await producer.stop()
        return f"Escalated to human support. Ticket {ticket_id}. Reason: {reason}"
    except Exception as e:
        logger.error(f"escalate_to_human error: {e}")
        return f"Escalation logged: {reason}"

# --- Tool 5 ---
@tool({
    "type": "function",
    "function": {
        "name": "send_response",
        "description": "Send response to customer. ALWAYS call this last — never skip. Formats message for the channel automatically.",
        "parameters": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "string"},
                "message": {"type": "string"},
                "channel": {"type": "string", "enum": ["email", "whatsapp", "web_form"]},
                "customer_email": {"type": "string"},
                "customer_phone": {"type": "string"}
            },
            "required": ["ticket_id", "message", "channel"]
        }
    }
})
async def send_response(ticket_id: str, message: str, channel: str,
                        customer_email: str = None, customer_phone: str = None) -> str:
    try:
        from agent.formatters import format_for_channel
        formatted = format_for_channel(message, channel, ticket_id)

        if channel == "email" and customer_email:
            from channels.gmail_handler import GmailHandler
            handler = GmailHandler()
            result = await handler.send_reply(customer_email, "Support Response", formatted)
            return f"Email sent: {result.get('delivery_status', 'sent')}"

        elif channel == "whatsapp" and customer_phone:
            from channels.whatsapp_handler import WhatsAppHandler
            handler = WhatsAppHandler()
            result = await handler.send_message(customer_phone, formatted)
            return f"WhatsApp sent: {result.get('delivery_status', 'sent')}"

        else:
            return f"Response stored for web retrieval. Ticket: {ticket_id}"

    except Exception as e:
        logger.error(f"send_response error: {e}")
        return f"Response delivery failed: {str(e)}"
