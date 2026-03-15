import os
import base64
import re
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

class GmailHandler:
    def __init__(self):
        credentials_path = os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json")
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        self.credentials = Credentials.from_authorized_user_file(credentials_path)
        self.service = build('gmail', 'v1', credentials=self.credentials)

    async def get_message(self, message_id: str) -> dict:
        msg = self.service.users().messages().get(
            userId='me', id=message_id, format='full'
        ).execute()
        headers = {h['name']: h['value'] for h in msg['payload']['headers']}
        body = self._extract_body(msg['payload'])
        return {
            'channel': 'email',
            'channel_message_id': message_id,
            'customer_email': self._extract_email(headers.get('From', '')),
            'subject': headers.get('Subject', ''),
            'content': body,
            'received_at': datetime.now(timezone.utc).isoformat(),
            'thread_id': msg.get('threadId'),
            'metadata': {'headers': headers}
        }

    async def send_reply(self, to_email: str, subject: str, body: str, thread_id: str = None) -> dict:
        from email.mime.text import MIMEText
        message = MIMEText(body)
        message['to'] = to_email
        message['subject'] = subject if subject.startswith('Re:') else f"Re: {subject}"
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        req = {'raw': raw}
        if thread_id:
            req['threadId'] = thread_id
        result = self.service.users().messages().send(userId='me', body=req).execute()
        return {'channel_message_id': result['id'], 'delivery_status': 'sent'}

    def _extract_body(self, payload: dict) -> str:
        if 'body' in payload and payload['body'].get('data'):
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        return ''

    def _extract_email(self, from_header: str) -> str:
        match = re.search(r'<(.+?)>', from_header)
        return match.group(1) if match else from_header
