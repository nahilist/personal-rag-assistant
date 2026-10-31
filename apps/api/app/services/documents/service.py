import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from fastapi import HTTPException, status

from app.repositories.models import (
    Document,
    DocumentGeneration,
    DocumentChunk,
    IngestionJob,
    OutboxEvent,
    QuotaReservation,
)
from app.services.documents.storage import storage_service
from app.services.quotas.limiter import quota_limiter
from app.core.config import settings
from app.core.logging import logger


class DocumentService:
    async def reserve_upload(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        filename: str,
        byte_size: int,
        mime_type: str,
    ) -> Dict[str, Any]:
        # Validate MIME type
        allowed_mimes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
        ]
        if mime_type not in allowed_mimes and not any(ext in filename.lower() for ext in [".pdf", ".docx", ".txt", ".md"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format: {mime_type}. MVP supports PDF, DOCX, TXT, and Markdown."
            )

        # 1. Atomically check quotas and reserve bytes
        reservation = await quota_limiter.check_and_reserve_upload_quota(
            session=session, user_id=user_id, byte_size=byte_size
        )

        doc_id = uuid.uuid4()
        storage_key = storage_service.build_storage_key(user_id, doc_id, filename)

        doc = Document(
            id=doc_id,
            user_id=user_id,
            title=filename,
            storage_key=storage_key,
            mime_type=mime_type,
            byte_size=byte_size,
            status="uploading",
            active_generation=1,
        )
        session.add(doc)
        await session.flush()

        upload_url = f"{settings.API_V1_PREFIX}/documents/{doc_id}/upload-binary"

        return {
            "document_id": str(doc_id),
            "storage_key": storage_key,
            "upload_url": upload_url,
            "expires_in_seconds": 900,
        }

    async def upload_binary(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
        file_bytes: bytes,
    ) -> int:
        stmt = select(Document).where(
            and_(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.deleted_at.is_(None),
            )
        )
        res = await session.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or access denied")

        if len(file_bytes) > settings.MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Uploaded file exceeds 20MB limit")

        # Save to storage
        saved_len = await storage_service.save_file(doc.storage_key, file_bytes)
        doc.byte_size = saved_len
        doc.checksum = hashlib.sha256(file_bytes).hexdigest()
        await session.flush()
        return saved_len

    async def complete_upload(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> Dict[str, Any]:
        stmt = select(Document).where(
            and_(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.deleted_at.is_(None),
            )
        )
        res = await session.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or access denied")

        # Verify file existence and actual size
        if not await storage_service.exists(doc.storage_key):
            raise HTTPException(status_code=400, detail="Uploaded file missing in storage")

        actual_size = await storage_service.get_size(doc.storage_key)
        if actual_size <= 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes)")

        doc.byte_size = actual_size
        doc.status = "queued"

        # Create ingestion job
        job = IngestionJob(
            id=uuid.uuid4(),
            user_id=user_id,
            document_id=document_id,
            generation=doc.active_generation,
            stage="queued",
            attempt=0,
            max_attempts=3,
            next_attempt_at=datetime.now(timezone.utc),
        )
        session.add(job)

        # Create transactional outbox event
        outbox = OutboxEvent(
            id=uuid.uuid4(),
            event_type="document.queued",
            entity_id=document_id,
            payload={
                "document_id": str(document_id),
                "user_id": str(user_id),
                "generation": doc.active_generation,
            },
        )
        session.add(outbox)
        await session.flush()

        return {
            "document_id": str(doc.id),
            "status": "queued",
            "message": "Upload complete. Document enqueued for background ingestion.",
        }

    async def retry_document(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> Dict[str, Any]:
        stmt = select(Document).where(
            and_(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.deleted_at.is_(None),
            )
        )
        res = await session.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        doc.status = "queued"
        doc.failure_code = None
        doc.failure_message = None

        job = IngestionJob(
            id=uuid.uuid4(),
            user_id=user_id,
            document_id=document_id,
            generation=doc.active_generation,
            stage="queued",
            attempt=0,
            max_attempts=3,
            next_attempt_at=datetime.now(timezone.utc),
        )
        session.add(job)

        outbox = OutboxEvent(
            id=uuid.uuid4(),
            event_type="document.queued",
            entity_id=document_id,
            payload={
                "document_id": str(document_id),
                "user_id": str(user_id),
                "generation": doc.active_generation,
            },
        )
        session.add(outbox)
        await session.flush()

        return {"document_id": str(document_id), "status": "queued"}

    async def delete_document(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> Dict[str, Any]:
        stmt = select(Document).where(
            and_(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.deleted_at.is_(None),
            )
        )
        res = await session.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Revoke search access IMMEDIATELY
        doc.deleted_at = datetime.now(timezone.utc)
        doc.status = "deleting"

        # Outbox event for asynchronous storage purge
        outbox = OutboxEvent(
            id=uuid.uuid4(),
            event_type="document.delete_requested",
            entity_id=document_id,
            payload={
                "document_id": str(document_id),
                "user_id": str(user_id),
                "storage_key": doc.storage_key,
            },
        )
        session.add(outbox)
        await session.flush()

        return {"document_id": str(document_id), "status": "deleting"}


document_service = DocumentService()
