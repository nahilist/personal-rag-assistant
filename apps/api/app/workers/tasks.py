import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.repositories.models import (
    Document,
    DocumentGeneration,
    DocumentChunk,
    IngestionJob,
)
from app.services.documents.storage import storage_service
from app.extraction.extractor import DocumentExtractor, ExtractionError
from app.extraction.chunker import DocumentChunker
from app.providers.embeddings import get_embedding_provider
from app.core.config import settings
from app.core.logging import logger


async def run_ingestion_job(session: AsyncSession, job_id: uuid.UUID) -> bool:
    """
    Executes a durable document ingestion job.
    Enforces leases, state checks, extraction bounds, vector embedding, and atomic generation activation.
    """
    # 1. Fetch job
    job_stmt = select(IngestionJob).where(IngestionJob.id == job_id)
    job_res = await session.execute(job_stmt)
    job = job_res.scalar_one_or_none()
    if not job or job.stage == "completed":
        return False

    # 2. Fetch document
    doc_stmt = select(Document).where(
        and_(Document.id == job.document_id, Document.user_id == job.user_id)
    )
    doc_res = await session.execute(doc_stmt)
    doc = doc_res.scalar_one_or_none()

    if not doc or doc.deleted_at is not None:
        logger.info(f"Document {job.document_id} was deleted or does not exist. Aborting job {job.id}.")
        job.stage = "aborted"
        await session.commit()
        return False

    # Acquire lease
    job.attempt += 1
    job.lease_until = datetime.now(timezone.utc) + timedelta(minutes=5)
    job.stage = "extracting"
    doc.status = "extracting"
    await session.commit()

    try:
        # Read raw bytes
        file_bytes = await storage_service.read_file(doc.storage_key)

        # Stage 1: Extraction
        pages = DocumentExtractor.extract(doc.mime_type, file_bytes)

        # Check deletion race
        await session.refresh(doc)
        if doc.deleted_at is not None:
            job.stage = "aborted"
            await session.commit()
            return False

        # Stage 2: Chunking
        job.stage = "chunking"
        doc.status = "chunking"
        await session.commit()

        chunks = DocumentChunker.chunk_pages(pages)

        # Stage 3: Embedding
        job.stage = "embedding"
        doc.status = "embedding"
        await session.commit()

        embedder = get_embedding_provider()
        chunk_texts = [c.content for c in chunks]
        embeddings = await embedder.embed_documents(chunk_texts)

        # Check deletion race before staging/activating
        await session.refresh(doc)
        if doc.deleted_at is not None:
            job.stage = "aborted"
            await session.commit()
            return False

        # Stage 4: Atomic Generation Staging and Activation
        current_gen = doc.active_generation

        # Clean existing chunks for this generation if retrying
        del_chunks = select(DocumentChunk).where(
            and_(
                DocumentChunk.document_id == doc.id,
                DocumentChunk.generation == current_gen,
            )
        )
        existing_chunks = (await session.execute(del_chunks)).scalars().all()
        for ch in existing_chunks:
            await session.delete(ch)

        # Insert new chunks
        for idx, (chunk_item, emb) in enumerate(zip(chunks, embeddings)):
            chunk_row = DocumentChunk(
                id=uuid.uuid4(),
                user_id=doc.user_id,
                document_id=doc.id,
                generation=current_gen,
                chunk_index=idx,
                content=chunk_item.content,
                embedding=emb,
                page_start=chunk_item.page_start,
                page_end=chunk_item.page_end,
                section=chunk_item.section,
                token_count=chunk_item.token_count,
                content_hash=chunk_item.content_hash,
            )
            session.add(chunk_row)

        # Record generation record
        gen_rec = DocumentGeneration(
            id=uuid.uuid4(),
            document_id=doc.id,
            user_id=doc.user_id,
            generation=current_gen,
            embedding_model=settings.EMBEDDING_MODEL,
            embedding_revision=settings.EMBEDDING_REVISION,
            dimensions=settings.EMBEDDING_DIMENSION,
            chunker_version="v1",
            state="active",
            activated_at=datetime.now(timezone.utc),
        )
        session.add(gen_rec)

        # Mark document ready
        doc.status = "ready"
        doc.failure_code = None
        doc.failure_message = None

        job.stage = "completed"
        job.lease_until = None
        await session.commit()
        logger.info(f"Successfully processed document {doc.id} ({len(chunks)} chunks).")
        return True

    except ExtractionError as e:
        logger.warning(f"Extraction error for document {doc.id}: {e.code} - {e.message}")
        doc.status = "failed"
        doc.failure_code = e.code
        doc.failure_message = e.message
        job.stage = "failed"
        job.error_code = e.code
        job.error_message = e.message
        job.lease_until = None
        await session.commit()
        return False

    except Exception as e:
        logger.error(f"Unexpected error during ingestion job {job.id}: {str(e)}", exc_info=True)
        if job.attempt >= job.max_attempts:
            doc.status = "failed"
            doc.failure_code = "processing_error"
            doc.failure_message = f"Processing failed after {job.max_attempts} attempts: {str(e)}"
            job.stage = "failed"
            job.error_code = "max_attempts_exceeded"
            job.error_message = str(e)
            job.lease_until = None
        else:
            job.stage = "queued"
            # Exponential backoff
            delay = 2 ** job.attempt
            job.next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
            job.lease_until = None

        await session.commit()
        return False

