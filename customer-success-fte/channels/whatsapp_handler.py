import os
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from dotenv import load_dotenv

load_dotenv()

class WhatsAppHandler:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        self.client = Client(self.account_sid, self.auth_token)
        self.validator = RequestValidator(self.auth_token)

    async def validate_webhook(self, url: str, params: dict, signature: str) -> bool:
        return self.validator.validate(url, params, signature)

    async def process_webhook(self, form_data: dict) -> dict:
        from datetime import datetime, timezone
        return {
            'channel': 'whatsapp',
            'channel_message_id': form_data.get('MessageSid'),
            'customer_phone': form_data.get('From', '').replace('whatsapp:', ''),
            'content': form_data.get('Body', ''),
            'received_at': datetime.now(timezone.utc).isoformat(),
            'metadata': {
                'profile_name': form_data.get('ProfileName'),
                'wa_id': form_data.get('WaId')
            }
        }

    async def send_message(self, to_phone: str, body: str) -> dict:
        if not to_phone.startswith('whatsapp:'):
            to_phone = f'whatsapp:{to_phone}'
        message = self.client.messages.create(
            body=body, from_=self.whatsapp_number, to=to_phone
        )
        return {'channel_message_id': message.sid, 'delivery_status': message.status}
