from groq import Groq
from config import settings
import logging

logger = logging.getLogger(__name__)

class GROQService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
    
    async def generate_response(self, customer_message: str, context: dict) -> str:
        """Generate response using GROQ API."""
        prompt = f"""You are a professional Customer Success agent.

Customer Message: {customer_message}
Channel: {context.get('channel')}
Category: {context.get('category')}

Provide a helpful, concise response. Be empathetic and solution-focused.
Keep WhatsApp responses under 300 chars, email can be longer.
"""
        
        try:
            # Note: Groq SDK uses chat.completions.create for completions
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=300,
                messages=[
                    {"role": "system", "content": "You are a professional Customer Success agent."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"GROQ API error: {e}")
            return "Thank you for your inquiry. A support agent will follow up shortly."
