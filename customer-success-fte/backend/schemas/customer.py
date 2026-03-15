from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class CustomerBase(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    email: EmailStr

class CustomerResponse(CustomerBase):
    id: UUID
    
    class Config:
        from_attributes = True
