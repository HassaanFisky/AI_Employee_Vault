import asyncio
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ai_service import AIService

async def test_ai():
    service = AIService()
    print("🚀 Testing AIService with OpenRouter/GROQ fallback...")
    
    response = await service.generate_response(
        "I need a refund for order #1234. It's been 5 days.",
        {"channel": "web_form", "category": "billing"}
    )
    
    print("\n--- AI RESPONSE ---")
    print(response)
    print("-------------------\n")

if __name__ == "__main__":
    asyncio.run(test_ai())
