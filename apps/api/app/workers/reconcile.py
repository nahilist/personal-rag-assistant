import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.repositories.models import IngestionJob, Document, DocumentChunk
from app.services.documents.storage import storage_service
from app.core.logging import logger


async def reconcile_stuck_leases(session: AsyncSession) -> int:
    """
    Finds jobs whose worker lease has expired without completing.
    Resets them to queued if under attempt limit, or fails them.
    """
    now = datetime.now(timezone.utc)
    stmt = select(IngestionJob).where(
        and_(
            IngestionJob.stage.in_(["extracting", "chunking", "embedding"]),
            IngestionJob.lease_until < now,
        )
    )
    res = await session.execute(stmt)
    stuck_jobs = res.scalars().all()

    repaired = 0
    for job in stuck_jobs:
        if job.attempt >= job.max_attempts:
            job.stage = "failed"
            job.error_code = "lease_expired"
            job.error_message = f"Worker lease expired after {job.max_attempts} attempts."
            job.lease_until = None
        else:
            job.stage = "queued"
            job.lease_until = None
        repaired += 1

    await session.commit()
    return repaired


async def purge_deleted_documents(session: AsyncSession) -> int:
    """
    Finds documents in 'deleting' state and purges their chunks and storage files.
    """
    stmt = select(Document).where(Document.status == "deleting").limit(10)
    res = await session.execute(stmt)
    docs = res.scalars().all()

    purged = 0
    for doc in docs:
        # Delete storage object
        try:
            await storage_service.delete_file(doc.storage_key)
        except Exception as e:
            logger.warning(f"Error purging file {doc.storage_key}: {str(e)}")

        # Delete chunks
        chunk_stmt = select(DocumentChunk).where(DocumentChunk.document_id == doc.id)
        chunks = (await session.execute(chunk_stmt)).scalars().all()
        for ch in chunks:
            await session.delete(ch)

        doc.status = "deleted"
        purged += 1

    await session.commit()
    return purged
