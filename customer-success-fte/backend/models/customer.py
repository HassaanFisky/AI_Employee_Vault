from sqlalchemy import Column, String, DateTime, UUID as SQL_UUID, func
from sqlalchemy.orm import relationship
from uuid import uuid4
from models.base import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(SQL_UUID, primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(50), nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    conversations = relationship("Conversation", back_populates="customer")
    tickets = relationship("Ticket", back_populates="customer")
