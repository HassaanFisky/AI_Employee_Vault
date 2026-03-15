"""
src/channels/whatsapp_handler.py
Twilio WhatsApp webhook handler — validates signatures and sends messages.
"""
from __future__ import annotations

import hmac
import hashlib
from typing import Any, Dict
from urllib.parse import urlencode

import structlog
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from src.config.settings import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()


def validate_twilio_signature(
    request_url: str,
    post_data: Dict[str, str],
    signature: str,
) -> bool:
    """
    Validate that an incoming webhook is genuinely from Twilio.
    https://www.twilio.com/docs/usage/webhooks/webhooks-security
    """
    from twilio.request_validator import RequestValidator
    validator = RequestValidator(settings.twilio_auth_token)
    return validator.validate(request_url, post_data, signature)


def parse_whatsapp_webhook(form_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse Twilio WhatsApp webhook form payload.

    Returns normalized message dict.
    """
    body = form_data.get("Body", "").strip()
    from_number = form_data.get("From", "")          # "whatsapp:+12125551234"
    to_number = form_data.get("To", "")
    message_sid = form_data.get("MessageSid", "")
    profile_name = form_data.get("ProfileName", "")

    # Strip "whatsapp:" prefix for storage
    clean_from = from_number.replace("whatsapp:", "")

    return {
        "body": body,
        "from_number": clean_from,
        "from_raw": from_number,
        "to_number": to_number,
        "message_sid": message_sid,
        "profile_name": profile_name,
        "num_media": int(form_data.get("NumMedia", 0)),
    }


class WhatsAppHandler:
    """Handles sending WhatsApp messages via Twilio."""

    def __init__(self) -> None:
        self._client = Client(
            settings.twilio_account_sid, settings.twilio_auth_token
        )

    async def send_message(self, to_number: str, body: str) -> str:
        """
        Send a WhatsApp message. to_number should be E.164 format (+12125551234).
        Returns the Twilio message SID.
        """
        # Ensure WhatsApp prefix
        to_ = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
        from_ = settings.twilio_whatsapp_number

        # WhatsApp length enforcement — soft limit 1600, but we target 300 chars
        body = body[:1600]

        try:
            message = self._client.messages.create(body=body, from_=from_, to=to_)
            log.info("WhatsApp message sent", sid=message.sid, to=to_[:15])
            return message.sid
        except TwilioRestException as exc:
            log.error("WhatsApp send failed", error=str(exc), to=to_[:15])
            raise
