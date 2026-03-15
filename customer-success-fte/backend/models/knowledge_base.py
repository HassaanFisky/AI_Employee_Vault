from sqlalchemy import Column, String, Text, DateTime, UUID as SQL_UUID, func
from uuid import uuid4
from models.base import Base

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    
    id = Column(SQL_UUID, primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
