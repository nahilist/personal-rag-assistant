import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.repositories.models import Message

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("/{id}/cancel")
async def cancel_request(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Message).where(
        and_(Message.request_key == id, Message.user_id == current_user.id)
    )
    res = await session.execute(stmt)
    msg = res.scalar_one_or_none()
    if msg and msg.status == "pending":
        msg.status = "cancelled"
        await session.commit()
    return {"request_id": str(id), "status": "cancelled"}


@router.get("/{id}")
async def get_request_status(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Message).where(
        and_(Message.request_key == id, Message.user_id == current_user.id)
    )
    res = await session.execute(stmt)
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Request not found")

    return {
        "request_id": str(id),
        "status": msg.status,
        "message_id": str(msg.id),
        "created_at": msg.created_at,
    }

