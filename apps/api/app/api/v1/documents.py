import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.repositories.models import Document, DocumentChunk
from app.services.documents.service import document_service
from app.services.documents.storage import storage_service
from app.workers.outbox import dispatch_pending_outbox_events
from app.schemas.documents import (
    UploadReservationRequest,
    UploadReservationResponse,
    CompleteUploadRequest,
    DocumentItemResponse,
    DocumentListResponse,
    DocumentSourceResponse,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/uploads", response_model=UploadReservationResponse)
async def reserve_upload(
    body: UploadReservationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    result = await document_service.reserve_upload(
        session=session,
        user_id=current_user.id,
        filename=body.filename,
        byte_size=body.byte_size,
        mime_type=body.mime_type,
    )
    await session.commit()
    return UploadReservationResponse(**result)


@router.post("/{id}/upload-binary")
async def upload_binary(
    id: uuid.UUID,
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="Empty body")
    saved_bytes = await document_service.upload_binary(
        session=session,
        user_id=current_user.id,
        document_id=id,
        file_bytes=data,
    )
    await session.commit()
    return {"status": "uploaded", "byte_size": saved_bytes}


@router.post("/{id}/complete", status_code=status.HTTP_202_ACCEPTED)
async def complete_upload(
    id: uuid.UUID,
    body: Optional[CompleteUploadRequest] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    result = await document_service.complete_upload(
        session=session,
        user_id=current_user.id,
        document_id=id,
    )
    await session.commit()
    # Trigger outbox dispatch to start background ingestion immediately
    try:
        await dispatch_pending_outbox_events(session)
    except Exception:
        pass
    return result


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    cursor: Optional[str] = None,
    limit: int = 20,
):
    stmt = (
        select(Document)
        .where(
            and_(
                Document.user_id == current_user.id,
                Document.deleted_at.is_(None),
            )
        )
        .order_by(desc(Document.created_at))
        .limit(limit)
    )
    res = await session.execute(stmt)
    docs = res.scalars().all()

    items = [
        DocumentItemResponse(
            id=d.id,
            title=d.title,
            mime_type=d.mime_type,
            byte_size=d.byte_size,
            status=d.status,
            active_generation=d.active_generation,
            failure_code=d.failure_code,
            failure_message=d.failure_message,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        for d in docs
    ]
    return DocumentListResponse(items=items, next_cursor=None, total=len(items))


@router.get("/{id}", response_model=DocumentItemResponse)
async def get_document(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(
        and_(
            Document.id == id,
            Document.user_id == current_user.id,
            Document.deleted_at.is_(None),
        )
    )
    res = await session.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    return DocumentItemResponse(
        id=doc.id,
        title=doc.title,
        mime_type=doc.mime_type,
        byte_size=doc.byte_size,
        status=doc.status,
        active_generation=doc.active_generation,
        failure_code=doc.failure_code,
        failure_message=doc.failure_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.post("/{id}/retry")
async def retry_document(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    result = await document_service.retry_document(
        session=session,
        user_id=current_user.id,
        document_id=id,
    )
    await session.commit()
    try:
        await dispatch_pending_outbox_events(session)
    except Exception:
        pass
    return result


@router.delete("/{id}", status_code=status.HTTP_202_ACCEPTED)
async def delete_document(
    id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    result = await document_service.delete_document(
        session=session,
        user_id=current_user.id,
        document_id=id,
    )
    await session.commit()
    return result


@router.get("/{id}/source", response_model=DocumentSourceResponse)
async def get_document_source(
    id: uuid.UUID,
    chunk_id: Optional[uuid.UUID] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Verify ownership
    doc_stmt = select(Document).where(
        and_(
            Document.id == id,
            Document.user_id == current_user.id,
            Document.deleted_at.is_(None),
        )
    )
    doc = (await session.execute(doc_stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    if chunk_id:
        chk_stmt = select(DocumentChunk).where(
            and_(
                DocumentChunk.id == chunk_id,
                DocumentChunk.document_id == id,
                DocumentChunk.user_id == current_user.id,
            )
        )
        chunk = (await session.execute(chk_stmt)).scalar_one_or_none()
        if not chunk:
            raise HTTPException(status_code=404, detail="Source excerpt not found")
        return DocumentSourceResponse(
            document_id=doc.id,
            title=doc.title,
            content=chunk.content,
            page_start=chunk.page_start,
            page_end=chunk.page_end,
            section=chunk.section,
        )

    # Return top sample or excerpt
    first_chunk_stmt = select(DocumentChunk).where(
        and_(
            DocumentChunk.document_id == id,
            DocumentChunk.user_id == current_user.id,
            DocumentChunk.chunk_index == 0,
        )
    )
    f_chunk = (await session.execute(first_chunk_stmt)).scalar_one_or_none()
    content = f_chunk.content if f_chunk else "(Processing or empty document)"
    return DocumentSourceResponse(
        document_id=doc.id,
        title=doc.title,
        content=content,
        page_start=f_chunk.page_start if f_chunk else None,
        page_end=f_chunk.page_end if f_chunk else None,
        section=f_chunk.section if f_chunk else None,
    )

