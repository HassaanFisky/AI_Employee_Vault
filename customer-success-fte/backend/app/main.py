"""
Customer Success AI Platform - FastAPI Backend
Integrated with GROQ (AI), Neon (DB), Twilio (Messaging)
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, get_db
from app.routes import tickets_router, admin_router, health_router
from app import models

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Create tables
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup and shutdown lifecycle"""
    logger.info("🚀 Customer Success AI Backend Starting...")
    logger.info(f"📊 Database: {settings.DATABASE_URL}")
    logger.info(f"🤖 AI Engine: GROQ")
    logger.info(f"💬 Messaging: Twilio")
    yield
    logger.info("🛑 Shutting down...")

app = FastAPI(
    title="Customer Success AI",
    description="Production-grade support platform with GROQ AI + Neon + Twilio",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "*.vercel.app",
        "*.neon.tech"
    ]
)

# Routes
app.include_router(health_router.router, prefix="/api/v1", tags=["health"])
app.include_router(tickets_router.router, prefix="/api/v1", tags=["tickets"])
app.include_router(
    admin_router.router,
    prefix="/api/v1/admin",
    tags=["admin"],
    dependencies=[Depends(admin_router.verify_admin_token)]
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Customer Success AI Platform",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/v1/health",
            "create_ticket": "POST /api/v1/tickets",
            "get_ticket": "GET /api/v1/tickets/{ticket_id}",
            "admin_metrics": "GET /api/v1/admin/metrics"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
