"""Pydantic request/response schemas"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class TicketCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    category: str = Field(..., min_length=1, max_length=50)
    subject: str = Field(..., min_length=5, max_length=500)
    message: str = Field(..., min_length=10, max_length=5000)
    priority: Optional[str] = "medium"
    phone: Optional[str] = None

class TicketResponse(BaseModel):
    id: int
    customer_id: int
    subject: str
    status: str
    ai_response: Optional[str]
    created_at: datetime
    sla_met: bool
    
    class Config:
        from_attributes = True

class AdminMetricsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    avg_response_time_seconds: float
    sla_adherence_percent: float
    customer_satisfaction_score: float
