# Discovery Log — Customer Success FTE

### Phase 1: Environment Setup
- Extracted Kafka credentials from `api-key-SQMQQ3QBGZGEKZME.txt`.
- Extracted Bootstrap server from `client.properties`.
- Configured `.env` with Neon database URL and Groq API keys.

### Phase 2: Schema Design
- Implemented PostgreSQL schema with `vector` extension support.
- Designed tables for: `customers`, `conversations`, `messages`, `tickets`, `knowledge_base`, `channel_configs`, and `agent_metrics`.

### Phase 3: Agent Architecture
- Built tool-calling loop using Groq's Llama 3.3 70B model.
- Integrated tools for Knowledge Base search, Ticket creation, History retrieval, and Multi-channel delivery.

### Phase 4: Channel Integration
- **Email**: Gmail API via OAuth2 credentials.
- **WhatsApp**: Twilio Messaging API.
- **Web Form**: FastAPI endpoint with async Kafka producer.

### Phase 5: Event-Driven Processing
- Unified worker listening on `fte.tickets.incoming` topic.
- Metrics and Escalations published to separate Kafka topics.
