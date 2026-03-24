import asyncpg
import os
import json
from dotenv import load_dotenv

# Load env from project root
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)
_pool = None

async def get_db_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=os.getenv("DATABASE_URL"),
            min_size=2,
            max_size=10
        )
    return _pool

async def get_or_create_customer(email=None, phone=None, name=None):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if email:
            row = await conn.fetchrow(
                "SELECT id FROM customers WHERE email = $1", email
            )
            if row:
                return str(row['id'])
            cid = await conn.fetchval(
                "INSERT INTO customers (email, name) VALUES ($1, $2) RETURNING id",
                email, name or ''
            )
            return str(cid)
        if phone:
            row = await conn.fetchrow(
                "SELECT customer_id FROM customer_identifiers WHERE identifier_type='whatsapp' AND identifier_value=$1",
                phone
            )
            if row:
                return str(row['customer_id'])
            cid = await conn.fetchval(
                "INSERT INTO customers (phone) VALUES ($1) RETURNING id", phone
            )
            await conn.execute(
                "INSERT INTO customer_identifiers (customer_id, identifier_type, identifier_value) VALUES ($1, 'whatsapp', $2)",
                cid, phone
            )
            return str(cid)
    raise ValueError("email or phone required")

async def get_or_create_conversation(customer_id, channel):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT id FROM conversations
               WHERE customer_id=$1 AND status='active'
               AND started_at > NOW() - INTERVAL '24 hours'
               ORDER BY started_at DESC LIMIT 1""",
            customer_id
        )
        if row:
            return str(row['id'])
        cid = await conn.fetchval(
            "INSERT INTO conversations (customer_id, initial_channel, status) VALUES ($1,$2,'active') RETURNING id",
            customer_id, channel
        )
        return str(cid)

async def store_message(conversation_id, channel, direction, role, content,
                        latency_ms=None, tool_calls=None, channel_message_id=None):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO messages
               (conversation_id, channel, direction, role, content, latency_ms, tool_calls, channel_message_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
            conversation_id, channel, direction, role, content,
            latency_ms, json.dumps(tool_calls or []), channel_message_id
        )

async def load_conversation_history(conversation_id):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT role, content FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
            conversation_id
        )
        result = []
        for r in rows:
            role = r['role'] if r['role'] in ['user', 'assistant', 'system'] else 'user'
            result.append({"role": role, "content": r['content']})
        return result

async def create_ticket_record(customer_id, conversation_id, channel, category='general', priority='medium'):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        tid = await conn.fetchval(
            """INSERT INTO tickets (customer_id, conversation_id, source_channel, category, priority, status)
               VALUES ($1,$2,$3,$4,$5,'open') RETURNING id""",
            customer_id, conversation_id, channel, category, priority
        )
        return str(tid)

async def get_ticket(ticket_id):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tickets WHERE id=$1", ticket_id)
        return dict(row) if row else None

async def update_ticket_status(ticket_id, status, notes=None):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tickets SET status=$1, resolution_notes=$2 WHERE id=$3",
            status, notes, ticket_id
        )

async def get_customer_full_history(customer_id):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT c.initial_channel, m.content, m.role, m.channel, m.created_at
               FROM conversations c
               JOIN messages m ON m.conversation_id = c.id
               WHERE c.customer_id=$1
               ORDER BY m.created_at DESC LIMIT 20""",
            customer_id
        )
        return [dict(r) for r in rows]
