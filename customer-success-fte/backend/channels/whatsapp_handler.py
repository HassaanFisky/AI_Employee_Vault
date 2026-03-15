from twilio.rest import Client
from twilio.request_validator import RequestValidator
import os
import logging

logger = logging.getLogger(__name__)

class WhatsAppHandler:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.validator = RequestValidator(self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials missing")
    
    async def process_webhook(self, form_data: dict) -> dict:
        """Process incoming WhatsApp message."""
        return {
            'channel': 'whatsapp',
            'channel_message_id': form_data.get('MessageSid'),
            'customer_phone': form_data.get('From', '').replace('whatsapp:', ''),
            'content': form_data.get('Body', ''),
        }
    
    async def send_message(self, to_phone: str, body: str) -> dict:
        """Send WhatsApp message via Twilio."""
        try:
            if not self.client:
                return {'delivery_status': 'failed', 'error': 'Twilio client not initialized'}
                
            if not to_phone.startswith('whatsapp:'):
                to_phone = f'whatsapp:{to_phone}'
            
            message = self.client.messages.create(
                body=body,
                from_=self.whatsapp_number,
                to=to_phone
            )
            return {
                'channel_message_id': message.sid,
                'delivery_status': message.status
            }
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            return {'delivery_status': 'failed', 'error': str(e)}
    
    def format_response(self, response: str, max_length: int = 1600) -> list[str]:
        """Split long responses for WhatsApp (max 1600 chars)."""
        if len(response) <= max_length:
            return [response]
        
        messages = []
        while response:
            if len(response) <= max_length:
                messages.append(response)
                break
            break_point = response.rfind('. ', 0, max_length)
            if break_point == -1:
                break_point = max_length
            messages.append(response[:break_point + 1].strip())
            response = response[break_point + 1:].strip()
        
        return messages
