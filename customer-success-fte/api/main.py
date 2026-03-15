import os
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from datetime import datetime, timezone
from channels.web_form_handler import router as web_form_router
from kafka_client import FTEKafkaProducer, TOPICS
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Customer Success FTE API",
    description="24/7 AI customer support — Email, WhatsApp, Web Form",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(web_form_router)
kafka_producer = FTEKafkaProducer()

@app.on_event("startup")
async def startup():
    await kafka_producer.start()

@app.on_event("shutdown")
async def shutdown():
    await kafka_producer.stop()

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "channels": {"email": "active", "whatsapp": "active", "web_form": "active"},
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }

@app.post("/webhooks/gmail")
async def gmail_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
        from channels.gmail_handler import GmailHandler
        handler = GmailHandler()
        messages = await handler.process_notification(body)
        for msg in messages:
            background_tasks.add_task(kafka_producer.publish, TOPICS['tickets_incoming'], msg)
        return {"status": "processed", "count": len(messages)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    form_data = await request.form()
    from channels.whatsapp_handler import WhatsAppHandler
    handler = WhatsAppHandler()
    msg = await handler.process_webhook(dict(form_data))
    background_tasks.add_task(kafka_producer.publish, TOPICS['tickets_incoming'], msg)
    return Response(
        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        media_type="application/xml"
    )

@app.get("/metrics/channels")
async def channel_metrics():
    from database.queries import get_db_pool
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT initial_channel as channel, COUNT(*) as total
               FROM conversations
               WHERE started_at > NOW() - INTERVAL '24 hours'
               GROUP BY initial_channel"""
        )
        return {r['channel']: {"total_conversations": r['total']} for r in rows}
