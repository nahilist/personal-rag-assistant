import uuid
import math
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.repositories.models import Document, DocumentChunk
from app.providers.embeddings import get_embedding_provider
from app.core.logging import logger


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    n1 = math.sqrt(sum(a * a for a in v1))
    n2 = math.sqrt(sum(b * b for b in v2))
    if n1 > 0 and n2 > 0:
        return dot / (n1 * n2)
    return 0.0


class RetrieverService:
    SIMILARITY_THRESHOLD = 0.05

    async def retrieve_candidates(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        query: str,
        document_ids: Optional[List[uuid.UUID]] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        embedder = get_embedding_provider()
        query_vector = await embedder.embed_query(query)

        # 1. Query only ready, non-deleted documents belonging to the user
        doc_stmt = select(Document.id, Document.title, Document.active_generation).where(
            and_(
                Document.user_id == user_id,
                Document.status == "ready",
                Document.deleted_at.is_(None),
            )
        )
        if document_ids:
            doc_stmt = doc_stmt.where(Document.id.in_(document_ids))

        doc_res = await session.execute(doc_stmt)
        allowed_docs = {row.id: (row.title, row.active_generation) for row in doc_res.all()}

        if not allowed_docs:
            return []

        # 2. Query chunks matching user_id and active generations
        chunk_stmt = select(DocumentChunk).where(
            and_(
                DocumentChunk.user_id == user_id,
                DocumentChunk.document_id.in_(list(allowed_docs.keys())),
            )
        )
        chunk_res = await session.execute(chunk_stmt)
        all_chunks = chunk_res.scalars().all()

        scored_chunks = []
        for ch in all_chunks:
            title, active_gen = allowed_docs.get(ch.document_id, (None, None))
            if ch.generation != active_gen:
                continue

            emb = ch.embedding
            if isinstance(emb, str):
                import json
                try:
                    emb = json.loads(emb)
                except Exception:
                    continue

            if not emb:
                continue

            sim = cosine_similarity(query_vector, emb)
            if sim >= self.SIMILARITY_THRESHOLD:
                scored_chunks.append((sim, ch, title))

        # Sort descending by similarity
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = scored_chunks[:top_k]

        results = []
        for idx, (sim, ch, title) in enumerate(top_chunks, start=1):
            results.append(
                {
                    "label": f"S{idx}",
                    "document_id": str(ch.document_id),
                    "document_title": title,
                    "chunk_id": str(ch.id),
                    "generation": ch.generation,
                    "similarity": round(sim, 4),
                    "page_start": ch.page_start,
                    "page_end": ch.page_end,
                    "section": ch.section,
                    "excerpt": ch.content,
                }
            )

        return results


retriever_service = RetrieverService()
