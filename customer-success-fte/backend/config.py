from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    environment: str = "production"
    
    # Database
    database_url: str
    
    # GROQ
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    
    # OpenRouter
    openrouter_api_key: str
    openrouter_model: str = "meta-llama/llama-3.1-8b-instruct:free"
    
    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_whatsapp_number: str
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 15
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
        # For pydantic-settings v2, we can also use env_file_encoding
        env_file_encoding = 'utf-8'

# Explicitly load .env before settings instantiation
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

settings = Settings()
