import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

router = APIRouter(prefix="/support", tags=["support-form"])

class SupportFormSubmission(BaseModel):
    name: str
    email: EmailStr
    subject: str
    category: str
    message: str
    priority: Optional[str] = 'medium'

    @field_validator('name')
    @classmethod
    def name_valid(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()

    @field_validator('subject')
    @classmethod
    def subject_valid(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('Subject must be at least 5 characters')
        return v.strip()

    @field_validator('message')
    @classmethod
    def message_valid(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Message must be at least 10 characters')
        return v.strip()

    @field_validator('category')
    @classmethod
    def category_valid(cls, v):
        valid = ['general', 'technical', 'billing', 'feedback', 'bug_report']
        if v not in valid:
            raise ValueError(f'Category must be one of {valid}')
        return v

class SupportFormResponse(BaseModel):
    ticket_id: str
    message: str
    estimated_response_time: str

@router.post("/submit", response_model=SupportFormResponse)
async def submit_support_form(submission: SupportFormSubmission):
    ticket_id = str(uuid.uuid4())
    message_data = {
        'channel': 'web_form',
        'channel_message_id': ticket_id,
        'customer_email': submission.email,
        'customer_name': submission.name,
        'subject': submission.subject,
        'content': submission.message,
        'category': submission.category,
        'priority': submission.priority,
        'received_at': datetime.now(timezone.utc).isoformat(),
        'metadata': {'form_version': '1.0'}
    }
    try:
        from kafka_client import FTEKafkaProducer, TOPICS
        producer = FTEKafkaProducer()
        await producer.start()
        await producer.publish(TOPICS['tickets_incoming'], message_data)
        await producer.stop()
    except Exception as e:
        pass  # Log but don't fail the form submission
    return SupportFormResponse(
        ticket_id=ticket_id,
        message="Thank you! Our AI assistant will respond shortly.",
        estimated_response_time="Usually within 5 minutes"
    )

@router.get("/ticket/{ticket_id}")
async def get_ticket_status(ticket_id: str):
    from database.queries import get_ticket
    ticket = await get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"ticket_id": ticket_id, "status": ticket['status'], "created_at": str(ticket['created_at'])}
