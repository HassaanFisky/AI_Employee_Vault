from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from sqlalchemy import select, func
from models.ticket import Ticket
from models.conversation import Conversation

router = APIRouter(tags=["admin"])

@router.get("/metrics/channels")
async def get_channel_metrics(db: AsyncSession = Depends(get_db)):
    """Retrieve channel-specific metrics."""
    result = await db.execute(
        select(Conversation.initial_channel, func.count(Conversation.id))
        .group_by(Conversation.initial_channel)
    )
    metrics = result.all()
    return {channel: count for channel, count in metrics}

@router.get("/metrics/tickets")
async def get_ticket_metrics(db: AsyncSession = Depends(get_db)):
    """Retrieve ticket status metrics."""
    result = await db.execute(
        select(Ticket.status, func.count(Ticket.id))
        .group_by(Ticket.status)
    )
    metrics = result.all()
    return {status: count for status, count in metrics}
