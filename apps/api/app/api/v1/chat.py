import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.services.chat.service import chat_service
from app.schemas.chat import ChatRequest

router = APIRouter(prefix="/conversations", tags=["chat"])


@router.post("/{id}/messages")
async def send_chat_message(
    id: uuid.UUID,
    body: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    POST fetch streaming with SSE-formatted events:
    - event: request
    - event: delta
    - event: sources
    - event: done
    """
    event_generator = chat_service.stream_chat(
        session=session,
        user_id=current_user.id,
        conversation_id=id,
        request_key=body.request_key,
        user_message_text=body.message,
        document_ids=body.document_ids,
        language=body.language or "en",
    )

    return StreamingResponse(
        event_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
