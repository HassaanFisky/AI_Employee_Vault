"""Twilio Service - SMS and WhatsApp notifications"""

from twilio.rest import Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class TwilioService:
    def __init__(self):
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )
        self.phone = settings.TWILIO_PHONE_NUMBER
        self.whatsapp = settings.TWILIO_WHATSAPP_NUMBER
    
    async def send_ticket_confirmation_sms(
        self,
        phone: str,
        ticket_id: int,
        customer_name: str
    ) -> bool:
        """Send ticket confirmation via SMS"""
        try:
            message = self.client.messages.create(
                body=f"Hi {customer_name}, your support ticket #{ticket_id} has been received. We'll respond within 2 hours. Reply STOP to opt out.",
                from_=self.phone,
                to=phone
            )
            logger.info(f"✅ SMS sent: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"❌ SMS error: {e}")
            return False
    
    async def send_response_whatsapp(
        self,
        phone: str,
        ticket_id: int,
        response_text: str
    ) -> bool:
        """Send support response via WhatsApp"""
        try:
            message_body = f"Ticket #{ticket_id}:\n\n{response_text}\n\nView full ticket: https://app.example.com/ticket/{ticket_id}"
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.whatsapp,
                to=f"whatsapp:{phone}"
            )
            logger.info(f"✅ WhatsApp sent: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"❌ WhatsApp error: {e}")
            return False
    
    async def send_satisfaction_survey(
        self,
        phone: str,
        ticket_id: int
    ) -> bool:
        """Send satisfaction survey via SMS"""
        try:
            message = self.client.messages.create(
                body=f"How was your support experience? Reply 1-10. Ticket: {ticket_id}",
                from_=self.phone,
                to=phone
            )
            logger.info(f"✅ Survey sent: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"❌ Survey error: {e}")
            return False

# Singleton instance
twilio_service = TwilioService()
