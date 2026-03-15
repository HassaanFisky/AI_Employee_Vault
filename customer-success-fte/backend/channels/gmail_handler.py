from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
import email
from email.mime.text import MIMEText
import logging
import os

logger = logging.getLogger(__name__)

class GmailHandler:
    def __init__(self, credentials_path: str):
        if os.path.exists(credentials_path):
            self.credentials = Credentials.from_authorized_user_file(credentials_path)
            self.service = build('gmail', 'v1', credentials=self.credentials)
        else:
            self.service = None
            logger.warning(f"Gmail credentials not found at {credentials_path}")
    
    async def get_message(self, message_id: str) -> dict:
        """Fetch Gmail message."""
        if not self.service:
            return None
        try:
            msg = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            headers = {h['name']: h['value'] for h in msg['payload']['headers']}
            body = self._extract_body(msg['payload'])
            
            return {
                'channel': 'email',
                'channel_message_id': message_id,
                'customer_email': self._extract_email(headers.get('From', '')),
                'subject': headers.get('Subject', ''),
                'content': body,
                'thread_id': msg.get('threadId'),
            }
        except Exception as e:
            logger.error(f"Gmail fetch failed: {e}")
            return None
    
    def _extract_body(self, payload: dict) -> str:
        """Extract text from payload."""
        if 'body' in payload and payload['body'].get('data'):
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        return ''
    
    def _extract_email(self, from_header: str) -> str:
        """Extract email from From header."""
        import re
        match = re.search(r'<(.+?)>', from_header)
        return match.group(1) if match else from_header
    
    async def send_reply(self, to_email: str, subject: str, body: str, thread_id: str = None) -> dict:
        """Send email reply."""
        if not self.service:
            return {'delivery_status': 'failed', 'error': 'Gmail service not initialized'}
        try:
            message = MIMEText(body)
            message['to'] = to_email
            message['subject'] = f"Re: {subject}" if not subject.startswith('Re:') else subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            send_request = {'raw': raw}
            if thread_id:
                send_request['threadId'] = thread_id
            
            result = self.service.users().messages().send(userId='me', body=send_request).execute()
            return {'channel_message_id': result['id'], 'delivery_status': 'sent'}
        except Exception as e:
            logger.error(f"Gmail send failed: {e}")
            return {'delivery_status': 'failed', 'error': str(e)}
