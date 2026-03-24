import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

class AIService:
    """Unified AI service supporting OpenRouter (primary) and GROQ (fallback)"""
    
    def __init__(self):
        self.openrouter_key = settings.openrouter_api_key
        self.openrouter_model = settings.openrouter_model
        self.groq_key = settings.groq_api_key
        self.groq_model = settings.groq_model

    async def generate_response(self, customer_message: str, context: dict) -> str:
        """
        Attempt OpenRouter first (Primary), then fall back to GROQ if needed.
        """
        
        prompt = f"""You are a professional Customer Success agent for WHOOSH AI.
Support interactions should be highly empathetic, efficient, and technically accurate.

Channel: {context.get('channel', 'web')}
Category: {context.get('category', 'general')}
Customer Message: {customer_message}

Constraints:
- Response MUST be concise.
- Short-form channels (WhatsApp/SMS) must be < 120 chars.
- Professional, yet autonomous and futuristic tone.
"""

        # 1. Try OpenRouter (Primary)
        if self.openrouter_key and "none" not in self.openrouter_key.lower() and "your_openrouter" not in self.openrouter_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://whoosh.ai",
                    "X-Title": "WHOOSH Customer Success Engine"
                }
                
                payload = {
                    "model": self.openrouter_model,
                    "messages": [
                        {"role": "system", "content": "You are a professional Customer Success agent for WHOOSH AI Operations."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500
                }
                
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return data['choices'][0]['message']['content'].strip()
                    else:
                        logger.error(f"OpenRouter Error {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"OpenRouter exception: {str(e)}")

        # 2. Try GROQ (Fallback)
        if self.groq_key and "none" not in self.groq_key.lower() and "your_groq" not in self.groq_key:
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_key)
                response = client.chat.completions.create(
                    model=self.groq_model,
                    messages=[
                        {"role": "system", "content": "You are a professional Customer Success agent for WHOOSH AI Operations."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"GROQ error: {str(e)}")

        # 3. Final safety fallback
        return "Thank you for contacting WHOOSH. Our autonomous systems are processing your telemetry. A human agent will override if necessary. How else can I help?"
