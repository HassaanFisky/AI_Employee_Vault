import httpx
import asyncio

async def t():
    data = {
        'name': 'Hassaan Test',
        'email': 'hassaan@test.com',
        'subject': 'Final verification',
        'category': 'technical',
        'message': 'Testing complete Aria system end to end'
    }
    url = 'https://spotty-agneta-hassaanfisky-2a742a92.koyeb.app/api/v1/channels/webform/submit'
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, json=data, timeout=60)
            print('Status:', r.status_code)
            print('Response:', r.json())
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(t())
