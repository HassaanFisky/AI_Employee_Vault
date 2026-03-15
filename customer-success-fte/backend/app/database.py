"""Database connection and session management"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Connection pooling (essential for serverless)
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,  # For Neon (serverless-friendly)
    echo=settings.ENVIRONMENT == "development"
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables on startup
from app import models
models.Base.metadata.create_all(bind=engine)
