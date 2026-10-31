import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from fastapi import HTTPException, status
from app.core.config import settings
from app.repositories.models import Document, QuotaReservation, UsageEvent


class QuotaLimiter:
    def __init__(self):
        # In-memory concurrent slot lease counter (can be backed by Redis in multi-replica)
        self._active_generations = 0

    async def get_user_usage(self, session: AsyncSession, user_id: uuid.UUID) -> Dict[str, int]:
        # Calculate active storage bytes and document count
        doc_stmt = select(
            func.count(Document.id).label("doc_count"),
            func.coalesce(func.sum(Document.byte_size), 0).label("storage_used")
        ).where(
            and_(
                Document.user_id == user_id,
                Document.deleted_at.is_(None)
            )
        )
        doc_res = await session.execute(doc_stmt)
        row = doc_res.one()
        doc_count = row.doc_count or 0
        storage_used = row.storage_used or 0

        # Calculate active uncommitted reservations
        res_stmt = select(
            func.coalesce(func.sum(QuotaReservation.units), 0)
        ).where(
            and_(
                QuotaReservation.user_id == user_id,
                QuotaReservation.state == "active",
                QuotaReservation.expires_at > datetime.now(timezone.utc)
            )
        )
        res_res = await session.execute(res_stmt)
        reserved_bytes = res_res.scalar_one_or_none() or 0

        # Today's request count
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        req_stmt = select(func.count(UsageEvent.id)).where(
            and_(
                UsageEvent.user_id == user_id,
                UsageEvent.kind == "llm_tokens",
                UsageEvent.created_at >= today_start
            )
        )
        req_res = await session.execute(req_stmt)
        today_requests = req_res.scalar_one_or_none() or 0

        return {
            "storage_bytes_used": storage_used + reserved_bytes,
            "storage_bytes_limit": settings.MAX_STORAGE_PER_USER,
            "document_count": doc_count,
            "document_limit": settings.MAX_DOCS_PER_USER,
            "today_requests": today_requests,
            "daily_request_limit": settings.MAX_DAILY_REQUESTS_PER_USER,
        }

    async def check_and_reserve_upload_quota(
        self, session: AsyncSession, user_id: uuid.UUID, byte_size: int
    ) -> QuotaReservation:
        if byte_size > settings.MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_BYTES // (1024*1024)} MB",
            )

        usage = await self.get_user_usage(session, user_id)

        if usage["document_count"] >= usage["document_limit"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Document quota reached ({usage['document_limit']} documents limit)",
            )

        if usage["storage_bytes_used"] + byte_size > usage["storage_bytes_limit"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Storage quota exceeded ({usage['storage_bytes_limit'] // (1024*1024)} MB limit)",
            )

        reservation = QuotaReservation(
            id=uuid.uuid4(),
            user_id=user_id,
            resource_type="storage_bytes",
            units=byte_size,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state="active",
        )
        session.add(reservation)
        await session.flush()
        return reservation

    async def commit_reservation(
        self, session: AsyncSession, reservation_id: uuid.UUID, actual_bytes: int
    ) -> None:
        stmt = select(QuotaReservation).where(QuotaReservation.id == reservation_id)
        res = await session.execute(stmt)
        reservation = res.scalar_one_or_none()
        if reservation:
            reservation.units = actual_bytes
            reservation.state = "committed"
            await session.flush()

    async def release_reservation(self, session: AsyncSession, reservation_id: uuid.UUID) -> None:
        stmt = select(QuotaReservation).where(QuotaReservation.id == reservation_id)
        res = await session.execute(stmt)
        reservation = res.scalar_one_or_none()
        if reservation and reservation.state == "active":
            reservation.state = "released"
            await session.flush()

    def acquire_generation_lease(self) -> bool:
        if self._active_generations >= settings.MAX_ACTIVE_GENERATIONS:
            return False
        self._active_generations += 1
        return True

    def release_generation_lease(self) -> None:
        if self._active_generations > 0:
            self._active_generations -= 1


quota_limiter = QuotaLimiter()

