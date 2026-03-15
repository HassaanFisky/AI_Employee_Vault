# Customer Success FTE Specification

## Overview
A 24/7 autonomous customer support system handling Email, WhatsApp, and Web Form inquiries using Groq Llama 3.3.

## Tech Stack
- **AI Engine**: Groq (Official Model: `llama-3.3-70b-versatile`)
- **Database**: Neon (PostgreSQL)
- **Messaging**: Confluent Cloud (Kafka)
- **Channels**: Gmail API, Twilio (WhatsApp), FastAPI (Web Form)

## Core Components
1. **API Server**: Handles webhooks from Gmail/Twilio and form submissions.
2. **Message Processor**: Unified worker that executes the Agent loop.
3. **Agent Loop**: 
   - Mandatory ticket creation.
   - History-aware context.
   - Documentation-based responses.
   - Automated escalation.

## Database Schema
Relational model tracking customer identity across channels, multi-turn conversation state, and individual message delivery status. Supports PGVector for future RAG enhancements.

## Kafka Topics
- `fte.tickets.incoming`: All raw messages from channels.
- `fte.escalations`: Events requiring human intervention.
- `fte.metrics`: Performance and sentiment data.
- `fte.dlq`: Dead Letter Queue for failed processing.
