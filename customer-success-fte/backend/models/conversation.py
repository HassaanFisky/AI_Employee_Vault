from sqlalchemy import Column, String, DateTime, ForeignKey, UUID as SQL_UUID, Numeric, func
from sqlalchemy.orm import relationship
from uuid import uuid4
from models.base import Base

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(SQL_UUID, primary_key=True, default=uuid4)
    customer_id = Column(SQL_UUID, ForeignKey("customers.id"), nullable=False)
    initial_channel = Column(String(50), nullable=False)  # 'email', 'whatsapp', 'web_form'
    started_at = Column(DateTime, default=func.now())
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="active")  # 'active', 'resolved', 'escalated'
    sentiment_score = Column(Numeric(3, 2), nullable=True)
    escalated_to = Column(String(255), nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")
    tickets = relationship("Ticket", back_populates="conversation")
