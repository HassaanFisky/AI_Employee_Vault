"""
src/channels/gmail_handler.py
Gmail API integration — polls inbox, parses emails, sends replies.
"""
from __future__ import annotations

import asyncio
import base64
import email as email_lib
import json
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import List, Optional

import structlog
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from src.config.settings import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()


class GmailHandler:
    """Handles Gmail polling and reply sending."""

    SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

    def __init__(self) -> None:
        self._service = None  # lazy init

    def _get_service(self):
        if self._service:
            return self._service

        creds: Optional[Credentials] = None
        token_path = Path(settings.gmail_token_path)
        creds_path = Path(settings.gmail_credentials_path)

        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), self.SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(creds_path), self.SCOPES
                )
                creds = flow.run_local_server(port=0)
            with open(token_path, "w") as token_file:
                token_file.write(creds.to_json())

        self._service = build("gmail", "v1", credentials=creds)
        return self._service

    def get_unread_messages(self, max_results: int = 50) -> List[dict]:
        """Fetch unread messages from the support inbox."""
        service = self._get_service()
        try:
            response = (
                service.users()
                .messages()
                .list(
                    userId="me",
                    q="is:unread -category:promotions -category:social",
                    maxResults=max_results,
                )
                .execute()
            )
            message_refs = response.get("messages", [])
            messages = []
            for ref in message_refs:
                msg = (
                    service.users()
                    .messages()
                    .get(userId="me", id=ref["id"], format="full")
                    .execute()
                )
                messages.append(msg)
            return messages
        except Exception as exc:
            log.error("Gmail fetch failed", error=str(exc))
            return []

    def mark_as_read(self, message_id: str) -> None:
        service = self._get_service()
        service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]},
        ).execute()

    def parse_message(self, raw_msg: dict) -> dict:
        """Extract sender, subject, body, and thread ID from a Gmail message."""
        headers = {
            h["name"].lower(): h["value"]
            for h in raw_msg.get("payload", {}).get("headers", [])
        }
        sender_raw = headers.get("from", "")
        # Extract just the email address from "Name <email>"
        match = re.search(r"<(.+?)>", sender_raw)
        sender_email = match.group(1) if match else sender_raw.strip()

        body = self._extract_body(raw_msg.get("payload", {}))

        return {
            "message_id": raw_msg["id"],
            "thread_id": raw_msg.get("threadId", ""),
            "sender_email": sender_email,
            "sender_name": re.sub(r"<.+?>", "", sender_raw).strip(),
            "subject": headers.get("subject", "(no subject)"),
            "body": body,
            "date": headers.get("date", ""),
        }

    def _extract_body(self, payload: dict) -> str:
        """Recursively extract plain-text body from a Gmail payload."""
        mime_type = payload.get("mimeType", "")
        if mime_type == "text/plain":
            data = payload.get("body", {}).get("data", "")
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")

        if mime_type == "text/html":
            # Fall back to HTML decode if no plain text found
            data = payload.get("body", {}).get("data", "")
            html = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
            return re.sub(r"<[^>]+>", " ", html).strip()

        # Multipart — recurse into parts
        for part in payload.get("parts", []):
            result = self._extract_body(part)
            if result:
                return result

        return ""

    async def send_reply(self, to: str, body_text: str, thread_id: str) -> str:
        """Send a reply in a Gmail thread. Returns the sent message ID."""
        service = self._get_service()
        msg = MIMEMultipart("alternative")
        msg["To"] = to
        msg["Subject"] = f"Re: Your Support Request"
        msg["In-Reply-To"] = thread_id
        msg["References"] = thread_id
        msg.attach(MIMEText(body_text, "plain"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
        sent = (
            service.users()
            .messages()
            .send(userId="me", body={"raw": raw, "threadId": thread_id})
            .execute()
        )
        log.info("Gmail reply sent", thread_id=thread_id, message_id=sent["id"])
        return sent["id"]


async def gmail_polling_loop(producer_publish_fn) -> None:
    """
    Background coroutine: poll Gmail every N seconds and publish to Kafka.
    producer_publish_fn: async callable(channel, sender_id, content, metadata)
    """
    handler = GmailHandler()
    log.info("Gmail polling started", interval=settings.gmail_poll_interval_seconds)

    while True:
        try:
            messages = handler.get_unread_messages()
            for raw_msg in messages:
                parsed = handler.parse_message(raw_msg)
                if not parsed["body"].strip():
                    continue

                await producer_publish_fn(
                    channel="email",
                    sender_id=parsed["sender_email"],
                    content=parsed["body"],
                    metadata={
                        "subject": parsed["subject"],
                        "message_id": parsed["message_id"],
                        "thread_id": parsed["thread_id"],
                        "sender_name": parsed["sender_name"],
                    },
                )
                handler.mark_as_read(parsed["message_id"])
                log.info("Email published to Kafka", from_=parsed["sender_email"])

        except Exception as exc:
            log.error("Gmail polling error", error=str(exc))

        await asyncio.sleep(settings.gmail_poll_interval_seconds)
