from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.repositories.models import Document, IngestionJob, Conversation, Message, UsageEvent

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics")
async def get_admin_metrics(session: AsyncSession = Depends(get_db)):
    """
    Returns operational metrics aggregated by IDs and categories.
    Strictly excludes private document text and full user prompts.
    """
    total_docs = (await session.execute(select(func.count(Document.id)))).scalar_one() or 0
    active_docs = (
        await session.execute(
            select(func.count(Document.id)).where(
                and_(Document.status == "ready", Document.deleted_at.is_(None))
            )
        )
    ).scalar_one() or 0

    pending_jobs = (
        await session.execute(
            select(func.count(IngestionJob.id)).where(IngestionJob.stage != "completed")
        )
    ).scalar_one() or 0

    failed_jobs = (
        await session.execute(
            select(func.count(IngestionJob.id)).where(IngestionJob.stage == "failed")
        )
    ).scalar_one() or 0

    total_conversations = (
        await session.execute(select(func.count(Conversation.id)))
    ).scalar_one() or 0

    total_messages = (
        await session.execute(select(func.count(Message.id)))
    ).scalar_one() or 0

    total_tokens = (
        await session.execute(
            select(func.coalesce(func.sum(UsageEvent.input_tokens + UsageEvent.output_tokens), 0))
        )
    ).scalar_one() or 0

    return {
        "documents": {
            "total": total_docs,
            "ready": active_docs,
        },
        "ingestion": {
            "pending_or_processing": pending_jobs,
            "failed": failed_jobs,
        },
        "chat": {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_tokens_consumed": total_tokens,
        },
    }
