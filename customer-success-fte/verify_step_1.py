import httpx
import asyncio

async def t():
    urls = [
        'https://spotty-agneta-hassaanfisky-2a742a92.koyeb.app/health',
        'https://spotty-agneta-hassaanfisky-2a742a92.koyeb.app/',
        'https://spotty-agneta-hassaanfisky-2a742a92.koyeb.app/api/v1/health'
    ]
    async with httpx.AsyncClient() as client:
        for url in urls:
            try:
                r = await client.get(url, timeout=30)
                print(f"URL: {url}")
                print(f"Status: {r.status_code}")
                print(f"Response: {r.text if r.status_code != 200 else r.json()}")
            except Exception as e:
                print(f"URL: {url} Error: {e}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(t())
