import asyncio
import logging
from datetime import datetime, timezone
from kafka_client import FTEKafkaConsumer, FTEKafkaProducer, TOPICS
from agent.customer_success_agent import run_agent
from database.queries import (
    get_or_create_customer, get_or_create_conversation,
    store_message, load_conversation_history
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UnifiedMessageProcessor:
    def __init__(self):
        self.producer = FTEKafkaProducer()

    async def start(self):
        await self.producer.start()
        consumer = FTEKafkaConsumer(
            topics=[TOPICS['tickets_incoming']],
            group_id='fte-message-processor'
        )
        await consumer.start()
        logger.info("Message processor started — listening on fte.tickets.incoming")
        await consumer.consume(self.process_message)

    async def process_message(self, topic: str, message: dict):
        try:
            start_time = datetime.now(timezone.utc)
            channel = message.get('channel', 'web_form')
            email = message.get('customer_email')
            phone = message.get('customer_phone')
            name = message.get('customer_name')

            customer_id = await get_or_create_customer(email=email, phone=phone, name=name)
            conversation_id = await get_or_create_conversation(customer_id, channel)

            await store_message(
                conversation_id, channel, 'inbound', 'user',
                message.get('content', ''),
                channel_message_id=message.get('channel_message_id')
            )

            history = await load_conversation_history(conversation_id)
            context = {
                'customer_id': customer_id,
                'conversation_id': conversation_id,
                'channel': channel,
                'customer_email': email,
                'customer_phone': phone,
                'ticket_subject': message.get('subject', 'Support Request')
            }

            result = await run_agent(history, context)
            latency_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            await store_message(
                conversation_id, channel, 'outbound', 'assistant',
                result['output'], latency_ms=latency_ms,
                tool_calls=result['tool_calls']
            )

            await self.producer.publish(TOPICS['metrics'], {
                'event_type': 'message_processed',
                'channel': channel,
                'latency_ms': latency_ms,
                'escalated': result['escalated']
            })

            logger.info(f"Processed {channel} message in {latency_ms}ms | escalated={result['escalated']}")

        except Exception as e:
            logger.error(f"Processing error: {e}")
            await self.producer.publish(TOPICS['escalations'], {
                'event_type': 'processing_error',
                'error': str(e),
                'original_message': message
            })

async def main():
    processor = UnifiedMessageProcessor()
    await processor.start()

if __name__ == "__main__":
    asyncio.run(main())
