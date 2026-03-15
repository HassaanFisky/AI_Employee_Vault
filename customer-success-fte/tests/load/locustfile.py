"""
tests/load/locustfile.py
Locust load test simulating concurrent customers across all channels.
Usage:
  locust -f tests/load/locustfile.py --headless -u 50 -r 5 -t 120s \
    --host http://localhost:8000
"""
from __future__ import annotations

import json
import random
import uuid
from locust import HttpUser, between, task

SAMPLE_MESSAGES = [
    "How do I reset my password?",
    "I can't log into my account.",
    "Where can I find my invoices?",
    "What is your refund policy?",
    "How do I upgrade my plan?",
    "My API key is not working.",
    "Can I invite team members?",
    "Do you support SSO/SAML?",
    "How do I export my data?",
    "I need help with the mobile app.",
    "My payments are failing.",
    "Can you explain the usage limits?",
    "I got an error 500 when uploading a file.",
    "How do I cancel my subscription?",
    "Is there a free trial?",
]

SAMPLE_EMAILS = [f"user{i}@testcompany.com" for i in range(1, 101)]
SAMPLE_NAMES = ["Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace"]


class WebFormUser(HttpUser):
    """Simulates customers using the web support form."""
    wait_time = between(1, 3)
    weight = 6

    def on_start(self):
        self.session_id = str(uuid.uuid4())
        self.email = random.choice(SAMPLE_EMAILS)
        self.name = random.choice(SAMPLE_NAMES)

    @task(3)
    def send_support_message(self):
        payload = {
            "session_id": self.session_id,
            "message": random.choice(SAMPLE_MESSAGES),
            "customer_email": self.email,
            "customer_name": self.name,
        }
        with self.client.post(
            "/support/message",
            json=payload,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Unexpected status {response.status_code}")

    @task(1)
    def health_check(self):
        self.client.get("/livez")

    @task(1)
    def metrics_summary(self):
        self.client.get("/metrics/summary")


class WhatsAppWebhookUser(HttpUser):
    """Simulates Twilio sending WhatsApp webhooks."""
    wait_time = between(2, 5)
    weight = 2

    def on_start(self):
        self.phone = f"+1{random.randint(2000000000, 9999999999)}"

    @task
    def send_whatsapp(self):
        data = {
            "From": f"whatsapp:{self.phone}",
            "To": "whatsapp:+14155238886",
            "Body": random.choice(SAMPLE_MESSAGES),
            "MessageSid": f"SM{uuid.uuid4().hex[:30]}",
            "NumMedia": "0",
            "ProfileName": random.choice(SAMPLE_NAMES),
        }
        with self.client.post(
            "/webhook/whatsapp",
            data=data,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"WhatsApp webhook failed: {response.status_code}")


class MonitoringUser(HttpUser):
    """Simulates monitoring / ops continuously hitting health endpoints."""
    wait_time = between(5, 10)
    weight = 1

    @task
    def liveness(self):
        self.client.get("/livez")

    @task
    def readiness(self):
        self.client.get("/readyz")

    @task
    def prometheus(self):
        self.client.get("/metrics")
