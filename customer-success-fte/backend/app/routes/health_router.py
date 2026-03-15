"""Health check and status endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Check API and database health"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "api": "online",
            "database": "connected",
            "ai_engine": "GROQ",
            "messaging": "Twilio"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
