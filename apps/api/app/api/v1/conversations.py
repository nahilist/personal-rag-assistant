import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.repositories.models import (
    Conversation,
    ConversationDocument,
    Message,
    MessageSource,
    Document,
)
from app.schemas.chat import (
    CreateConversationRequest,
    ConversationResponse,
    ConversationListResponse,
    MessageResponse,
    MessageListResponse,
    MessageSourceResponse,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationResponse)
async def create_conversation(
    body: CreateConversationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Validate document IDs belong to user
    doc_ids: List[uuid.UUID] = []
    if body.document_ids:
        v_stmt = select(Document.id).where(
            and_(
                Document.id.in_(body.document_ids),
                Document.user_id == current_user.id,
                Document.deleted_at.is_(None),
            )
        )
        doc_ids = (await session.execute(v_stmt)).scalars().all()

    conv = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=body.title or "New Conversation",
        language=body.language or "en",
    )
    session.add(conv)
    await session.flush()

    for d_id in doc_ids:
        session.add(
            ConversationDocument(
                conversation_id=conv.id,
                document_id=d_id,
                user_id=current_user.id,
            )
        )

    await session.commit()

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        language=conv.language,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        document_ids=doc_ids,
    )


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    stmt = (
        select(Conversation)
        .where(
            and_(
                Conversation.user_id == current_user.id,
                Conversation.deleted_at.is_(None),
            )
        )
        .order_by(desc(Conversation.created_at))
        .limit(limit)
    )
    res = await session.execute(stmt)
    convs = res.scalars().all()

    items = []
    for c in convs:
        # Fetch document scope
        sc_stmt = select(ConversationDocument.document_id).where(
            ConversationDocument.conversation_id == c.id
        )
        doc_ids = (await session.execute(sc_stmt)).scalars().all()
        items.append(
            ConversationResponse(
                id=c.id,
                title=c.title,
                language=c.language,
                created_at=c.created_at,
                updated_at=c.updated_at,
                document_ids=doc_ids,
            )
        )

    return ConversationListResponse(items=items, next_cursor=None, total=len(items))


@router.get("/{id}/messages", response_model=MessageListResponse)
async def get_conversation_messages(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Verify ownership
    conv_stmt = select(Conversation).where(
        and_(
            Conversation.id == id,
            Conversation.user_id == current_user.id,
            Conversation.deleted_at.is_(None),
        )
    )
    conv = (await session.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied")

    msg_stmt = (
        select(Message)
        .where(
            and_(
                Message.conversation_id == id,
                Message.user_id == current_user.id,
            )
        )
        .order_by(Message.created_at.asc())
    )
    messages = (await session.execute(msg_stmt)).scalars().all()

    items = []
    for m in messages:
        # Fetch sources if assistant message
        sources = None
        if m.role == "assistant":
            src_stmt = select(MessageSource).where(
                and_(
                    MessageSource.message_id == m.id,
                    MessageSource.user_id == current_user.id,
                )
            )
            src_rows = (await session.execute(src_stmt)).scalars().all()
            sources = [
                MessageSourceResponse(
                    label=s.source_label,
                    document_id=s.document_id,
                    chunk_id=s.chunk_id,
                    page_start=s.page_start,
                    page_end=s.page_end,
                    section=s.section,
                    excerpt=s.excerpt,
                )
                for s in src_rows
            ]

        items.append(
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                status=m.status,
                created_at=m.created_at,
                sources=sources,
            )
        )

    return MessageListResponse(items=items, total=len(items))


@router.patch("/{id}", response_model=ConversationResponse)
async def update_conversation(
    id: uuid.UUID,
    body: CreateConversationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    conv_stmt = select(Conversation).where(
        and_(
            Conversation.id == id,
            Conversation.user_id == current_user.id,
            Conversation.deleted_at.is_(None),
        )
    )
    conv = (await session.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied")

    if body.title is not None:
        conv.title = body.title
    if body.language is not None:
        conv.language = body.language

    if body.document_ids is not None:
        # Clear existing
        del_stmt = select(ConversationDocument).where(ConversationDocument.conversation_id == id)
        for cd in (await session.execute(del_stmt)).scalars().all():
            await session.delete(cd)

        # Validate and insert new
        v_stmt = select(Document.id).where(
            and_(
                Document.id.in_(body.document_ids),
                Document.user_id == current_user.id,
                Document.deleted_at.is_(None),
            )
        )
        valid_ids = (await session.execute(v_stmt)).scalars().all()
        for d_id in valid_ids:
            session.add(
                ConversationDocument(
                    conversation_id=id,
                    document_id=d_id,
                    user_id=current_user.id,
                )
            )

    await session.commit()
    await session.refresh(conv)

    # Return updated doc ids
    sc_stmt = select(ConversationDocument.document_id).where(
        ConversationDocument.conversation_id == id
    )
    doc_ids = (await session.execute(sc_stmt)).scalars().all()

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        language=conv.language,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        document_ids=doc_ids,
    )


@router.delete("/{id}")
async def delete_conversation(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    conv_stmt = select(Conversation).where(
        and_(
            Conversation.id == id,
            Conversation.user_id == current_user.id,
            Conversation.deleted_at.is_(None),
        )
    )
    conv = (await session.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied")

    conv.deleted_at = conv.updated_at
    await session.commit()
    return {"status": "deleted", "id": str(id)}
