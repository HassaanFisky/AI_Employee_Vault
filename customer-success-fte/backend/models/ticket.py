from sqlalchemy import Column, String, DateTime, ForeignKey, UUID as SQL_UUID, func
from sqlalchemy.orm import relationship
from uuid import uuid4
from models.base import Base

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(SQL_UUID, primary_key=True, default=uuid4)
    conversation_id = Column(SQL_UUID, ForeignKey("conversations.id"), nullable=True)
    customer_id = Column(SQL_UUID, ForeignKey("customers.id"), nullable=False)
    source_channel = Column(String(50), nullable=False)
    category = Column(String(100), nullable=True)
    priority = Column(String(20), default="medium")
    status = Column(String(50), default="open")  # 'open', 'resolved', 'escalated'
    created_at = Column(DateTime, default=func.now())
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(String, nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="tickets")
    customer = relationship("Customer", back_populates="tickets")
