from sqlalchemy import Column, String, Boolean, JSON, UUID as SQL_UUID
from uuid import uuid4
from models.base import Base

class ChannelConfig(Base):
    __tablename__ = "channel_configs"
    
    id = Column(SQL_UUID, primary_key=True, default=uuid4)
    channel = Column(String(50), unique=True, nullable=False)
    enabled = Column(Boolean, default=True)
    config = Column(JSON, default={})  # API keys, webhooks, etc.
    response_template = Column(String, nullable=True)
