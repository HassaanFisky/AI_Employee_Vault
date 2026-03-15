"""Configuration management using Pydantic Settings"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """App settings from environment variables"""
    
    # Database
    DATABASE_URL: str
    
    # GROQ AI (Free API, no payment)
    GROQ_API_KEY: str
    GROQ_MODEL: str = "mixtral-8x7b-32768"  # Free tier
    
    # Twilio
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str  # SMS number
    TWILIO_WHATSAPP_NUMBER: str  # WhatsApp number
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
