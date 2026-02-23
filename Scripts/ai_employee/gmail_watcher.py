"""
Gmail Watcher for AI Employee - Silver Tier
Author: Muhammad Hassaan Aslam
Karachi, Pakistan — GIAIC Hackathon 0
"""

import os
import json
import time
import logging
import base64
from pathlib import Path
from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

VAULT_PATH = Path(r"C:\AI_Employee_Vault")
NEEDS_ACTION = VAULT_PATH / "Needs_Action"
LOGS_FOLDER = VAULT_PATH / "Logs"
CREDENTIALS_FILE = VAULT_PATH / "credentials.json"
TOKEN_FILE = VAULT_PATH / "token.json"

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

CHECK_INTERVAL = 60

NEEDS_ACTION.mkdir(parents=True, exist_ok=True)
LOGS_FOLDER.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOGS_FOLDER / "gmail_watcher.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("GmailWatcher")


def log_action(action_type, details):
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = LOGS_FOLDER / f"{today}.json"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "action_type": action_type,
        "actor": "gmail_watcher",
        "details": details,
        "result": "success"
    }
    existing = []
    if log_file.exists():
        try:
            existing = json.loads(log_file.read_text(encoding="utf-8"))
        except Exception:
            existing = []
    existing.append(entry)
    log_file.write_text(json.dumps(existing, indent=2, default=str), encoding="utf-8")


def authenticate():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_FILE), SCOPES
            )
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
        logger.info("Authentication successful — token.json saved")
    return creds


def get_email_body(msg):
    body = ""
    if "data" in msg["payload"].get("body", {}):
        body = base64.urlsafe_b64decode(
            msg["payload"]["body"]["data"]
        ).decode("utf-8", errors="ignore")
    elif "parts" in msg["payload"]:
        for part in msg["payload"]["parts"]:
            if part.get("mimeType") == "text/plain":
                if "data" in part.get("body", {}):
                    body = base64.urlsafe_b64decode(
                        part["body"]["data"]
                    ).decode("utf-8", errors="ignore")
                    break
    return body[:2000]


def create_needs_action_file(subject, sender, body, msg_id):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_subject = "".join(
        c if c.isalnum() or c in " _-" else "_"
        for c in subject
    )[:50]
    meta = f"""---
type: email
email_id: {msg_id}
subject: {subject}
from: {sender}
detected_at: {datetime.now().isoformat()}
status: pending
priority: normal
source: Gmail
---

# Email Received: {subject}

## From
{sender}

## Subject
{subject}

## Body Preview
{body}

## Suggested Actions
- [ ] Read full email
- [ ] Draft reply if needed
- [ ] File to appropriate folder
- [ ] Move to /Done when complete
"""
    path = NEEDS_ACTION / f"EMAIL_{ts}_{safe_subject}.md"
    path.write_text(meta, encoding="utf-8")
    logger.info(f"Created: {path.name}")
    log_action("email_detected", {
        "subject": subject,
        "from": sender,
        "msg_id": msg_id,
        "file": path.name
    })
    update_dashboard(subject, sender)


def update_dashboard(subject, sender):
    dashboard = VAULT_PATH / "Dashboard.md"
    if not dashboard.exists():
        return
    content = dashboard.read_text(encoding="utf-8")
    marker = "## Recent Activity"
    if marker in content:
        entry = (
            f"- [{datetime.now().strftime('%Y-%m-%d %H:%M')}] "
            f"📧 Email from {sender}: {subject[:40]}"
        )
        content = content.replace(marker, f"{marker}\n{entry}")

    import re
    pending = len(list(NEEDS_ACTION.glob("*.md")))
    content = re.sub(
        r"\| Pending Actions \| \d+ \|",
        f"| Pending Actions | {pending} |",
        content
    )
    dashboard.write_text(content, encoding="utf-8")
    logger.info("Dashboard updated")


def check_new_emails(service, last_check_id):
    result = service.users().messages().list(
        userId="me",
        labelIds=["INBOX"],
        maxResults=10
    ).execute()

    messages = result.get("messages", [])
    if not messages:
        return last_check_id

    latest_id = messages[0]["id"]
    if latest_id == last_check_id:
        logger.info("No new emails")
        return last_check_id

    new_emails = []
    for msg in messages:
        if msg["id"] == last_check_id:
            break
        new_emails.append(msg["id"])

    logger.info(f"{len(new_emails)} new email(s) found")

    for msg_id in new_emails:
        msg = service.users().messages().get(
            userId="me",
            id=msg_id,
            format="full"
        ).execute()

        headers = {
            h["name"]: h["value"]
            for h in msg["payload"].get("headers", [])
        }
        subject = headers.get("Subject", "No Subject")
        sender = headers.get("From", "Unknown Sender")
        body = get_email_body(msg)

        create_needs_action_file(subject, sender, body, msg_id)

    return latest_id


def main():
    logger.info("=" * 60)
    logger.info("Gmail Watcher — Silver Tier")
    logger.info(f"Vault: {VAULT_PATH}")
    logger.info(f"Check interval: {CHECK_INTERVAL}s")
    logger.info("=" * 60)

    creds = authenticate()
    service = build("gmail", "v1", credentials=creds)
    logger.info("Connected to Gmail")

    result = service.users().messages().list(
        userId="me", labelIds=["INBOX"], maxResults=1
    ).execute()
    messages = result.get("messages", [])
    last_check_id = messages[0]["id"] if messages else None
    logger.info(f"Starting from message ID: {last_check_id}")
    logger.info("Watching for new emails... Press Ctrl+C to stop")

    try:
        while True:
            last_check_id = check_new_emails(service, last_check_id)
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        logger.info("Gmail Watcher stopped")


if __name__ == "__main__":
    main()
