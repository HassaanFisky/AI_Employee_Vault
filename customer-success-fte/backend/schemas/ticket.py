from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class TicketBase(BaseModel):
    subject: str
    category: str
    message: str
    priority: Optional[str] = "medium"

class TicketCreate(TicketBase):
    name: str
    email: EmailStr

class TicketResponse(TicketBase):
    id: UUID
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketStatusUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None
