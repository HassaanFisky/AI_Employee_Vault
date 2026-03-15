# TechCorp Customer Success FTE

24/7 AI-powered customer support agent capable of handling complex queries across multiple channels with full audit trails and automated escalations.

## 🚀 Key Features
- **Omnichannel**: Unified support via Email, WhatsApp, and Web Forms.
- **Groq-Powered**: High-speed, low-latency reasoning using Llama 3.3.
- **Event-Driven**: Built on Confluent Cloud (Kafka) for robust scalability.
- **Cloud Native**: PostgreSQL on Neon for persistence and Vector support.

## 🛠️ Tech Stack
- **AI**: Groq (Llama 3-3-70b-versatile)
- **Messaging**: Confluent Cloud (Kafka)
- **Database**: Neon (PostgreSQL)
- **Channels**: Gmail API, Twilio WhatsApp, FastAPI

## 🏃 Getting Started

### Prerequisites
1. Python 3.10+
2. Neon PostgreSQL Project
3. Confluent Cloud Kafka Cluster
4. Groq API Key

### Installation
```bash
cd C:\AI_Employee_Vault\customer-success-fte\
pip install -r requirements.txt
```

### Running Locally

**Terminal 1: API Server**
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2: Message Processor**
```bash
python workers/message_processor.py
```

## 📂 Project Structure
- `agent/`: Core LLM logic, prompts, and tool definitions.
- `channels/`: Integrations for Gmail, WhatsApp, and Web Forms.
- `database/`: Schema and async querying layer.
- `workers/`: Background task processors.
- `k8s/`: Kubernetes deployment manifests.
