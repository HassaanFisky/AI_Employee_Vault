from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UUID as SQL_UUID, Integer, JSON, func
from sqlalchemy.orm import relationship
from uuid import uuid4
from models.base import Base

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(SQL_UUID, primary_key=True, default=uuid4)
    conversation_id = Column(SQL_UUID, ForeignKey("conversations.id"), nullable=False)
    channel = Column(String(50), nullable=False)  # 'email', 'whatsapp', 'web_form'
    direction = Column(String(20), nullable=False)  # 'inbound', 'outbound'
    role = Column(String(20), nullable=False)  # 'customer', 'agent', 'system'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    tool_calls = Column(JSON, default=[])
    channel_message_id = Column(String(255), nullable=True)  # External ID
    delivery_status = Column(String(50), default="pending")  # 'pending', 'sent', 'delivered', 'failed'
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
