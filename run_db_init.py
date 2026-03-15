import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run_schema():
    dsn = os.getenv("DATABASE_URL")
    print(f"Connecting to: {dsn[:20]}...")
    
    conn = await asyncpg.connect(dsn)
    try:
        schema_path = os.path.join(os.getcwd(), "database", "schema.sql")
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        
        print("Executing schema.sql...")
        await conn.execute(schema_sql)
        print("Schema execution complete.")
        
        # Verify tables
        rows = await conn.fetch("""
            SELECT tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
        """)
        print("Tables in database:")
        for row in rows:
            print(f"- {row['tablename']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_schema())
