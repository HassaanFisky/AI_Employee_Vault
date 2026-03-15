# TechCorp Customer Success Digital FTE

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-FF6B35?style=flat)](https://groq.com)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E5CC?style=flat&logo=postgresql&logoColor=white)](https://neon.tech)
[![Confluent](https://img.shields.io/badge/Confluent-Kafka-231F20?style=flat&logo=apachekafka&logoColor=white)](https://confluent.io)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

> **24/7 AI-powered customer success engine** — handles Email, WhatsApp, and Web support autonomously using LLM-driven tool loops, Kafka event streaming, and pgvector semantic search.

---

## 📸 Screenshots

| Dashboard | Tickets | Knowledge Base |
|-----------|---------|----------------|
| _Mission Control view with real-time metrics_ | _Filterable ticket table with expand-on-click threads_ | _Searchable KB with category pills_ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INBOUND CHANNELS                            │
│                                                                 │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────────┐       │
│  │  Gmail   │    │  WhatsApp   │    │   Web Form /     │       │
│  │  Inbox   │    │  (Twilio)   │    │   WebSocket Chat │       │
│  └────┬─────┘    └──────┬──────┘    └────────┬─────────┘       │
│       │                 │                    │                  │
│       └────────────┬────┘                    │                  │
│                    ▼                         │                  │
│         ┌──────────────────┐                 │                  │
│         │  fte.tickets     │◄────────────────┘                  │
│         │  .incoming       │  Confluent Cloud Kafka             │
│         │  (Kafka Topic)   │                                    │
│         └────────┬─────────┘                                    │
│                  │                                              │
│                  ▼                                              │
│       ┌──────────────────────┐                                  │
│       │  Message Processor   │  Kafka Consumer Worker           │
│       │  (workers/)          │                                  │
│       └────────┬─────────────┘                                  │
│                │                                                │
│                ▼                                                │
│    ┌───────────────────────────────────┐                        │
│    │      ARIA AI Agent (Groq)         │  llama-3.3-70b        │
│    │                                   │  Tool Loop:           │
│    │  ┌────────────┐ ┌──────────────┐  │  1. search_kb         │
│    │  │ search_kb  │ │create_ticket │  │  2. create_ticket     │
│    │  │(pgvector)  │ │              │  │  3. get_history        │
│    │  └────────────┘ └──────────────┘  │  4. escalate          │
│    │  ┌────────────┐ ┌──────────────┐  │  5. send_response     │
│    │  │get_history │ │  escalate    │  │                       │
│    │  └────────────┘ └──────────────┘  │                       │
│    └───────────┬───────────────────────┘                        │
│                │                                                │
│     ┌──────────▼───────────┐  ┌──────────────────────────┐     │
│     │  Neon PostgreSQL     │  │  fte.metrics (Kafka)     │     │
│     │  + pgvector          │  │  fte.escalations         │     │
│     │  8 tables, ORM       │  │  fte.dlq                 │     │
│     └──────────────────────┘  └──────────────────────────┘     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           NEXT.JS 14 COMMAND CENTER (Frontend)          │    │
│  │  /dashboard · /tickets · / (chat) · /knowledge         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (No Docker Required)

### Prerequisites
- Python 3.11+
- Node.js 18+
- An `.env` file with your API keys (see `.env.example`)

### 1. Backend Setup

```bash
cd customer-success-fte
pip install -r requirements.txt
```

Create `.env` in `customer-success-fte/`:
```bash
cp .env.example .env
# Fill in all values — see .env.example for required keys
```

Start the FastAPI server:
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (Command Center Dashboard)

```bash
cd customer-success-fte/web-form
npm install
cp .env.example .env.local
npm run dev
```

App available at: [http://localhost:3000](http://localhost:3000)

| Route | Description |
|-------|-------------|
| `/` | Web support chat widget |
| `/dashboard` | Mission Control — metrics, health, AI terminal |
| `/tickets` | Filterable ticket management table |
| `/tickets/[id]` | Single ticket with conversation thread |
| `/knowledge` | Knowledge base with search |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Engine** | Groq `llama-3.3-70b-versatile` | LLM agent with tool loop, context-aware reasoning |
| **Database** | Neon Serverless PostgreSQL + pgvector | Tickets, conversations, knowledge base + semantic search |
| **Event Bus** | Confluent Cloud Kafka | Async ticket processing, 4 topics, SASL_SSL |
| **WhatsApp** | Twilio WhatsApp Business API | Inbound/outbound WhatsApp messages |
| **Email** | Gmail API with OAuth2 | Gmail inbox polling + reply sender |
| **Backend API** | FastAPI (Python 3.11) | REST + WebSocket, async, CORS, webhooks |
| **Frontend** | Next.js 14 (App Router) + TypeScript | Command center dashboard, real-time WebSocket chat |
| **Styling** | Tailwind CSS v3 | Custom design system with dark mode tokens |
| **Deployment** | Vercel (frontend) + K8s (backend) | Cloud-native, horizontally scalable |

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | System health + service status |
| `GET` | `/metrics/channels` | Per-channel conversation stats (24h) |
| `GET` | `/metrics/summary` | Aggregated dashboard KPIs |
| `GET` | `/tickets` | List tickets (paginated, filterable) |
| `GET` | `/tickets/{id}` | Single ticket + message history |
| `POST` | `/support/message` | Submit chat message to AI agent |
| `WS` | `/support/ws/{session_id}` | WebSocket for real-time chat |
| `POST` | `/webhooks/gmail` | Gmail push notification webhook |
| `POST` | `/webhooks/whatsapp` | Twilio WhatsApp webhook |
| `GET` | `/knowledge` | List/search knowledge base articles |

---

## 📁 Project Structure

```
customer-success-fte/
├── agent/                      # Flat structure agent (Groq tool loop)
│   ├── customer_success_agent.py
│   ├── tools.py                # search_kb, create_ticket, get_history, escalate, send_response
│   ├── prompts.py
│   └── formatters.py
├── api/
│   └── main.py                 # FastAPI app + all REST endpoints
├── channels/
│   ├── gmail_handler.py
│   ├── whatsapp_handler.py
│   └── web_form_handler.py
├── database/
│   ├── schema.sql              # 8-table PostgreSQL schema
│   └── queries.py              # asyncpg query functions
├── workers/
│   └── message_processor.py   # Kafka consumer → agent runner
├── src/                        # Production-grade src/ structure (SQLAlchemy ORM)
│   ├── agent/                  # Full agent with sentiment + escalation patterns
│   ├── api/                    # FastAPI with lifespan, middleware, structured logging
│   ├── channels/               # WebSocket manager, Gmail poller, Twilio sender
│   ├── config/                 # Pydantic Settings
│   ├── database/               # SQLAlchemy async engine + ORM models
│   └── workers/                # Redis queue producer/consumer
├── web-form/                   # Next.js 14 Command Center Frontend
│   ├── src/app/
│   │   ├── (app)/              # Shared Sidebar layout
│   │   │   ├── dashboard/      # Mission Control
│   │   │   ├── tickets/        # Ticket management
│   │   │   └── knowledge/      # Knowledge base
│   │   └── page.tsx            # Landing + support form
│   └── src/components/         # Design system (atoms/molecules/organisms)
├── k8s/                        # Kubernetes manifests (10+ resources)
├── docker/                     # Dockerfiles (reference only, not for local dev)
├── tests/                      # Unit + integration + load tests
├── specs/                      # Discovery log + system spec
├── docs/                       # Deployment guide
├── requirements.txt
└── .env.example
```

---

## ✅ Hackathon Compliance Checklist

- [x] **AI-powered agent** — Groq `llama-3.3-70b-versatile` with 5-tool ReAct loop
- [x] **Multi-channel support** — Gmail, WhatsApp (Twilio), Web Form
- [x] **Real-time chat** — WebSocket `/support/ws/{session_id}` with typing indicators
- [x] **Kafka event streaming** — Confluent Cloud, 4 topics, SASL_SSL
- [x] **Vector database** — Neon pgvector for semantic KB search
- [x] **Production-grade API** — FastAPI with Pydantic, async, CORS, error handling
- [x] **Premium frontend** — Next.js 14 App Router, custom design system, responsive
- [x] **Command Center dashboard** — Live health, metrics, AI thought terminal
- [x] **Ticket management** — Full CRUD, filterable, expand-on-click thread view
- [x] **Knowledge base** — Search + category filtering, 12+ articles
- [x] **Vercel deploy ready** — `vercel.json`, env config, standalone Next.js output
- [x] **K8s manifests** — Deployments, HPA, Ingress, Secrets, ConfigMap
- [x] **Database migrations** — Alembic setup with full schema
- [x] **Tests** — Unit, integration, and Locust load tests

---

## 👨‍💻 Author

**Muhammad Hassaan Aslam**  
Karachi, Pakistan  
[GIAIC Hackathon 0 + Hackathon 5] — CRM Digital FTE Factory  
_Built for the AI_Employee_Vault repository_

---

## 📄 License

MIT © 2026 Muhammad Hassaan Aslam
