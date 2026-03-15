import httpx
import json

payload = {
    "name": "Test User",
    "email": "test@example.com", 
    "subject": "Testing the system",
    "category": "technical",
    "message": "This is an end-to-end test of the support system"
}

try:
    response = httpx.post("http://localhost:8000/support/submit", json=payload, timeout=15)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
