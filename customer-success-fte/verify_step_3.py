import asyncio, asyncpg, os
from dotenv import load_dotenv

async def t():
    load_dotenv(os.path.join(os.getcwd(), ".env"))
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return
    
    try:
        conn = await asyncpg.connect(db_url)
        # Use simple select to check top 5 tickets
        rows = await conn.fetch('SELECT id, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5')
        for r in rows:
            print(dict(r))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(t())
