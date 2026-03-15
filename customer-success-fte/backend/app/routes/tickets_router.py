"""API routes for ticket management"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.database import get_db
from app.schemas.ticket import TicketCreateRequest, TicketResponse
from app.services.groq_service import groq_service
from app.services.twilio_service import twilio_service
from app import models

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/tickets", response_model=dict)
async def create_ticket(
    request: TicketCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new support ticket
    
    Flow:
    1. Validate input
    2. Create customer if not exists
    3. Create ticket
    4. Generate AI response using GROQ
    5. Send SMS confirmation + WhatsApp response
    6. Return ticket ID
    """
    try:
        # Check if customer exists
        customer = db.query(models.Customer).filter(
            models.Customer.email == request.email
        ).first()
        
        if not customer:
            customer = models.Customer(
                email=request.email,
                full_name=request.full_name,
                phone=request.phone,
                company=None
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
            logger.info(f"✅ New customer: {request.email}")
        
        # Create ticket
        ticket = models.Ticket(
            customer_id=customer.id,
            category=request.category,
            subject=request.subject,
            message=request.message,
            priority=request.priority or "medium",
            status="open"
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        logger.info(f"✅ Ticket created: #{ticket.id}")
        
        # Generate AI response async
        ai_response = await groq_service.generate_response(
            customer_name=request.full_name,
            category=request.category,
            message=request.message
        )
        
        ticket.ai_response = ai_response
        ticket_response = models.TicketResponse(
            ticket_id=ticket.id,
            responder="ai_agent",
            message=ai_response
        )
        db.add(ticket_response)
        db.commit()
        logger.info(f"✅ AI response added")
        
        # Send notifications if phone provided
        if request.phone:
            await twilio_service.send_ticket_confirmation_sms(
                phone=request.phone,
                ticket_id=ticket.id,
                customer_name=request.full_name
            )
            
            await twilio_service.send_response_whatsapp(
                phone=request.phone,
                ticket_id=ticket.id,
                response_text=ai_response[:200]  # First 200 chars
            )
        
        return {
            "ticket_id": ticket.id,
            "status": "open",
            "message": "Ticket created successfully",
            "sla_response_hours": 2,
            "estimated_resolution_hours": 24
        }
    
    except Exception as e:
        logger.error(f"❌ Ticket creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create ticket"
        )

@router.get("/tickets/{ticket_id}", response_model=dict)
async def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve ticket with all responses"""
    try:
        ticket = db.query(models.Ticket).filter(
            models.Ticket.id == ticket_id
        ).first()
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        responses = db.query(models.TicketResponse).filter(
            models.TicketResponse.ticket_id == ticket_id
        ).all()
        
        return {
            "id": ticket.id,
            "subject": ticket.subject,
            "status": ticket.status,
            "priority": ticket.priority,
            "category": ticket.category,
            "created_at": ticket.created_at.isoformat(),
            "responses": [
                {
                    "responder": r.responder,
                    "message": r.message,
                    "created_at": r.created_at.isoformat()
                }
                for r in responses
            ]
        }
    
    except Exception as e:
        logger.error(f"❌ Get ticket error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve ticket"
        )
