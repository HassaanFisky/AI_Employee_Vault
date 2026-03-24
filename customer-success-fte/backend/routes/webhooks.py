from fastapi import APIRouter, Request, Header, HTTPException
import logging
import asyncio
from channels.whatsapp_handler import WhatsAppHandler
from channels.gmail_handler import GmailHandler
from database.queries import (
    get_or_create_customer, 
    get_or_create_conversation, 
    store_message, 
    load_conversation_history
)
from agent.customer_success_agent import run_agent

router = APIRouter(tags=["webhooks"])
logger = logging.getLogger(__name__)

whatsapp_handler = WhatsAppHandler()
gmail_handler = GmailHandler()

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, x_twilio_signature: str = Header(None)):
    """Handle incoming WhatsApp messages from Twilio."""
    form_data = await request.form()
    data = dict(form_data)
    
    # 1. Verification (Simplified for now, but signature exists)
    logger.info(f"Received WhatsApp webhook from {data.get('From')}")
    
    try:
        # 2. Extract Data
        incoming = await whatsapp_handler.process_webhook(data)
        phone = incoming['customer_phone']
        content = incoming['content']
        
        # 3. Identify Customer & Conversation
        customer_id = await get_or_create_customer(phone=phone)
        conversation_id = await get_or_create_conversation(customer_id, "whatsapp")
        
        # 4. Store Inbound Message
        await store_message(
            conversation_id=conversation_id,
            channel="whatsapp",
            direction="inbound",
            role="user",
            content=content,
            channel_message_id=incoming['channel_message_id']
        )
        
        # 5. Load History & Context
        history = await load_conversation_history(conversation_id)
        context = {
            "channel": "whatsapp",
            "customer_id": customer_id,
            "conversation_id": conversation_id,
            "phone": phone
        }
        
        # 6. Run AI Agent
        start_time = asyncio.get_event_loop().time()
        agent_result = await run_agent(history, context)
        latency_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        
        # 7. Store & Send Response
        if agent_result['output']:
            # Store Outbound
            await store_message(
                conversation_id=conversation_id,
                channel="whatsapp",
                direction="outbound",
                role="assistant",
                content=agent_result['output'],
                latency_ms=latency_ms,
                tool_calls=agent_result['tool_calls']
            )
            
            # Send via Twilio
            await whatsapp_handler.send_message(phone, agent_result['output'])
            
        return {"status": "success", "agent_responded": bool(agent_result['output'])}
        
    except Exception as e:
        logger.error(f"WhatsApp Webhook Error: {str(e)}", exc_info=True)
        return {"status": "error", "detail": str(e)}

@router.post("/gmail")
async def gmail_webhook(request: Request):
    """Handle incoming Gmail push notifications."""
    payload = await request.json()
    
    # Gmail Push usually gives a message ID that we need to fetch
    # This implementation assumes the standard pub/sub format
    try:
        if 'message' in payload and 'data' in payload['message']:
            import base64
            import json
            data = json.loads(base64.b64decode(payload['message']['data']).decode('utf-8'))
            message_id = data.get('messageId')
            
            if not message_id:
                return {"status": "no_message_id"}
                
            # 1. Fetch Full Message
            email_data = await gmail_handler.get_message(message_id)
            email = email_data['customer_email']
            content = email_data['content']
            
            # 2. Identify Customer & Conversation
            customer_id = await get_or_create_customer(email=email)
            conversation_id = await get_or_create_conversation(customer_id, "email")
            
            # 3. Store Inbound
            await store_message(
                conversation_id=conversation_id,
                channel="email",
                direction="inbound",
                role="user",
                content=content,
                channel_message_id=message_id
            )
            
            # 4. Load History & Context
            history = await load_conversation_history(conversation_id)
            context = {
                "channel": "email",
                "customer_id": customer_id,
                "conversation_id": conversation_id,
                "email": email,
                "subject": email_data['subject']
            }
            
            # 5. Run AI Agent
            start_time = asyncio.get_event_loop().time()
            agent_result = await run_agent(history, context)
            latency_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            
            # 6. Store & Send Response
            if agent_result['output']:
                await store_message(
                    conversation_id=conversation_id,
                    channel="email",
                    direction="outbound",
                    role="assistant",
                    content=agent_result['output'],
                    latency_ms=latency_ms,
                    tool_calls=agent_result['tool_calls']
                )
                
                await gmail_handler.send_reply(
                    email, 
                    email_data['subject'], 
                    agent_result['output'],
                    thread_id=email_data.get('thread_id')
                )
                
            return {"status": "success"}
            
    except Exception as e:
        logger.error(f"Gmail Webhook Error: {str(e)}", exc_info=True)
        return {"status": "error", "detail": str(e)}

    return {"status": "ignored"}
