"""
src/api/routes/whatsapp.py
Twilio WhatsApp webhook — validates signature and publishes to Kafka.
"""
from __future__ import annotations

import structlog
from fastapi import APIRouter, Form, Header, HTTPException, Request, status
from fastapi.responses import PlainTextResponse

from src.channels.whatsapp_handler import parse_whatsapp_webhook, validate_twilio_signature
from src.config.settings import get_settings
from src.workers.redis_producer import get_producer

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/webhook", tags=["WhatsApp"])
settings = get_settings()


@router.post(
    "/whatsapp",
    response_class=PlainTextResponse,
    summary="Twilio WhatsApp incoming message webhook",
)
async def whatsapp_webhook(
    request: Request,
    X_Twilio_Signature: str = Header(None, alias="X-Twilio-Signature"),
) -> PlainTextResponse:
    """
    Receives incoming WhatsApp messages from Twilio.
    Validates the Twilio signature, then publishes the message to Kafka.
    Returns an empty 200 so Twilio doesn't retry.
    """
    form_data = dict(await request.form())

    # Validate signature in production
    if settings.is_production:
        url = str(request.url)
        if not X_Twilio_Signature or not validate_twilio_signature(
            url, {k: v for k, v in form_data.items()}, X_Twilio_Signature
        ):
            log.warning("Invalid Twilio signature", url=url)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Twilio signature",
            )

    parsed = parse_whatsapp_webhook(form_data)

    if not parsed["body"]:
        log.info("Empty WhatsApp message ignored", from_=parsed["from_number"][:10])
        return PlainTextResponse("", status_code=200)

    producer = get_producer()
    event_id = await producer.publish_message(
        channel="whatsapp",
        sender_id=parsed["from_number"],
        content=parsed["body"],
        metadata={
            "message_sid": parsed["message_sid"],
            "profile_name": parsed["profile_name"],
            "to_number": parsed["to_number"],
            "num_media": parsed["num_media"],
        },
    )

    log.info(
        "WhatsApp message published",
        event_id=event_id,
        from_=parsed["from_number"][:10],
    )
    return PlainTextResponse("", status_code=200)
