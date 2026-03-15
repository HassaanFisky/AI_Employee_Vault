"""GROQ AI Service - Free, powerful LLM without OpenAI pricing"""

from groq import Groq
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL
    
    async def generate_response(
        self,
        customer_name: str,
        category: str,
        message: str,
        context: str = ""
    ) -> str:
        """
        Generate AI response using GROQ (Free API)
        
        Args:
            customer_name: Customer's full name
            category: Support category (Technical, Billing, etc.)
            message: Customer's issue description
            context: Additional context (similar tickets, etc.)
        
        Returns:
            AI-generated response
        """
        try:
            system_prompt = f"""
You are a world-class customer support agent for a SaaS platform.
You are empathetic, solution-focused, and concise.
You respond within 2-3 paragraphs maximum.
You never make promises you can't keep about timelines or refunds.
If you need human escalation, clearly state that.

Customer: {customer_name}
Issue Category: {category}
"""
            
            user_message = f"{message}\n\n{context}" if context else message
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            ai_text = response.choices[0].message.content
            logger.info(f"✅ GROQ response generated for {customer_name}")
            return ai_text
        
        except Exception as e:
            logger.error(f"❌ GROQ error: {str(e)}")
            return "We're experiencing high demand. A human agent will respond shortly."
    
    async def classify_priority(self, message: str) -> str:
        """Classify message priority using GROQ"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": f"Classify this support issue as LOW, MEDIUM, or HIGH priority. Issue: {message}"
                }],
                max_tokens=10,
                temperature=0.3
            )
            
            priority_text = response.choices[0].message.content.strip().upper()
            for p in ["HIGH", "MEDIUM", "LOW"]:
                if p in priority_text:
                    return p.lower()
            return "medium"
        
        except Exception as e:
            logger.error(f"Priority classification error: {e}")
            return "medium"

# Singleton instance
groq_service = GroqService()
