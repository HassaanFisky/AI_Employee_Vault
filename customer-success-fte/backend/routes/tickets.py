from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from models.customer import Customer
from models.ticket import Ticket
from models.conversation import Conversation
from models.message import Message
from services.ai_service import AIService
from sqlalchemy import select

router = APIRouter(prefix="/support", tags=["support"])
ai_service = AIService()

class SupportFormSubmission(BaseModel):
    name: str
    email: EmailStr
    subject: str
    category: str
    message: str
    priority: Optional[str] = 'medium'
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Message must be at least 10 characters')
        return v.strip()
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        valid = ['general', 'technical', 'billing', 'feedback', 'bug_report']
        if v not in valid:
            raise ValueError(f'Category must be one of: {valid}')
        return v

@router.post("/submit")
async def submit_support_form(submission: SupportFormSubmission, db: AsyncSession = Depends(get_db)):
    """Web form submission endpoint with AI triage via OpenRouter/GROQ."""
    try:
        # 1. Customer Management
        result = await db.execute(select(Customer).where(Customer.email == submission.email))
        customer = result.scalars().first()
        
        if not customer:
            customer = Customer(
                name=submission.name,
                email=submission.email
            )
            db.add(customer)
            await db.flush()
        
        # 2. Conversation Tracking
        conversation = Conversation(
            customer_id=customer.id,
            initial_channel="web_form",
            status="active"
        )
        db.add(conversation)
        await db.flush()
        
        # 3. Message Recording (Inbound)
        inbound_msg = Message(
            conversation_id=conversation.id,
            channel="web_form",
            direction="inbound",
            role="customer",
            content=submission.message
        )
        db.add(inbound_msg)
        
        # 4. Ticket Creation
        ticket = Ticket(
            conversation_id=conversation.id,
            customer_id=customer.id,
            source_channel="web_form",
            category=submission.category,
            priority=submission.priority,
            status="open"
        )
        db.add(ticket)
        await db.flush()
        
        # 5. AI Response Generation (Unified AI Service)
        ai_response_text = await ai_service.generate_response(
            submission.message, 
            {"channel": "web_form", "category": submission.category}
        )
        
        # 6. Message Recording (Outbound)
        outbound_msg = Message(
            conversation_id=conversation.id,
            channel="web_form",
            direction="outbound",
            role="agent",
            content=ai_response_text
        )
        db.add(outbound_msg)
        
        await db.commit()
        
        return {
            'ticket_id': str(ticket.id),
            'conversation_id': str(conversation.id),
            'ai_response': ai_response_text,
            'message': 'Thank you! Our WHOOSH AI support team has analyzed your request.',
            'estimated_response_time': 'Usually within 5 minutes'
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ticket/{ticket_id}")
async def get_ticket_status(ticket_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve ticket details."""
    try:
        result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
        ticket = result.scalars().first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return {
            "id": str(ticket.id),
            "status": ticket.status,
            "category": ticket.category,
            "created_at": ticket.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
