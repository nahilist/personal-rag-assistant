import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.repositories.models import OutboxEvent, IngestionJob
from app.workers.tasks import run_ingestion_job
from app.core.logging import logger


async def dispatch_pending_outbox_events(session: AsyncSession) -> int:
    """
    Finds unpublished outbox events and triggers their processing.
    """
    stmt = (
        select(OutboxEvent)
        .where(OutboxEvent.published_at.is_(None))
        .order_by(OutboxEvent.created_at.asc())
        .limit(20)
    )
    res = await session.execute(stmt)
    events = res.scalars().all()

    dispatched = 0
    for evt in events:
        if evt.event_type == "document.queued":
            payload = evt.payload or {}
            doc_id_str = payload.get("document_id")
            if doc_id_str:
                doc_id = uuid.UUID(doc_id_str)
                # Find queued job
                job_stmt = select(IngestionJob).where(
                    and_(
                        IngestionJob.document_id == doc_id,
                        IngestionJob.stage == "queued",
                    )
                )
                j_res = await session.execute(job_stmt)
                job = j_res.scalar_one_or_none()
                if job:
                    # In local/async mode, run directly; in celery mode, enqueue to celery
                    await run_ingestion_job(session, job.id)

        evt.published_at = datetime.now(timezone.utc)
        dispatched += 1

    await session.commit()
    return dispatched

