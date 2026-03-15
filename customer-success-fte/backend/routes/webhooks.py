from fastapi import APIRouter, Request, Depends
import logging

router = APIRouter(tags=["webhooks"])
logger = logging.getLogger(__name__)

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp messages from Twilio."""
    form_data = await request.form()
    logger.info(f"Received WhatsApp webhook: {form_data}")
    # Process messaging logic here
    return {"status": "received"}

@router.post("/gmail")
async def gmail_webhook(request: Request):
    """Handle incoming Gmail push notifications."""
    payload = await request.json()
    logger.info(f"Received Gmail webhook: {payload}")
    # Process Gmail logic here
    return {"status": "received"}
