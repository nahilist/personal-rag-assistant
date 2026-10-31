import uuid
import json
import re
from typing import AsyncGenerator, List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.repositories.models import (
    Conversation,
    ConversationDocument,
    Message,
    MessageSource,
    UsageEvent,
)
from app.services.retrieval.retriever import retriever_service
from app.services.retrieval.prompts import build_system_message, budget_messages
from app.services.quotas.limiter import quota_limiter
from app.providers.llm import get_llm_provider
from app.extraction.chunker import count_tokens
from app.core.logging import logger


class ChatService:
    async def get_or_create_conversation(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        conversation_id: Optional[uuid.UUID] = None,
        title: Optional[str] = None,
        document_ids: Optional[List[uuid.UUID]] = None,
        language: str = "en",
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(
                and_(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id,
                    Conversation.deleted_at.is_(None),
                )
            )
            res = await session.execute(stmt)
            conv = res.scalar_one_or_none()
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
            return conv

        conv = Conversation(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title or "New Chat",
            language=language,
        )
        session.add(conv)
        await session.flush()

        if document_ids:
            for d_id in document_ids:
                session.add(
                    ConversationDocument(
                        conversation_id=conv.id,
                        document_id=d_id,
                        user_id=user_id,
                    )
                )
            await session.flush()

        return conv

    async def stream_chat(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        conversation_id: uuid.UUID,
        request_key: uuid.UUID,
        user_message_text: str,
        document_ids: Optional[List[uuid.UUID]] = None,
        language: str = "en",
    ) -> AsyncGenerator[str, None]:
        # 1. Verify conversation ownership
        conv_stmt = select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
                Conversation.deleted_at.is_(None),
            )
        )
        res = await session.execute(conv_stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")

        # 2. Check idempotency on request_key
        existing_msg_stmt = select(Message).where(
            and_(Message.user_id == user_id, Message.request_key == request_key)
        )
        existing_res = await session.execute(existing_msg_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Duplicate request key")

        # 3. Check and acquire global active generation slot lease
        if not quota_limiter.acquire_generation_lease():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Inference capacity currently saturated. Please retry in a few moments.",
            )

        try:
            # 4. Save user message
            user_msg = Message(
                id=uuid.uuid4(),
                conversation_id=conversation_id,
                user_id=user_id,
                role="user",
                content=user_message_text,
                request_key=request_key,
                token_count=count_tokens(user_message_text),
                status="completed",
            )
            session.add(user_msg)
            await session.flush()

            # Emit initial request event
            yield f"event: request\ndata: {json.dumps({'request_id': str(request_key), 'message_id': str(user_msg.id)})}\n\n"

            # 5. Determine document scope
            target_doc_ids = document_ids
            if not target_doc_ids:
                # Query conversation scoped documents if configured
                scoped_stmt = select(ConversationDocument.document_id).where(
                    and_(
                        ConversationDocument.conversation_id == conversation_id,
                        ConversationDocument.user_id == user_id,
                    )
                )
                sc_res = await session.execute(scoped_stmt)
                target_doc_ids = sc_res.scalars().all() or None

            # 6. Retrieve authorized candidates
            candidates = await retriever_service.retrieve_candidates(
                session=session,
                user_id=user_id,
                query=user_message_text,
                document_ids=target_doc_ids,
                top_k=5,
            )

            # 7. Build prompt context and history
            sys_prompt = build_system_message(candidates, language=language)

            # Fetch recent conversation history
            hist_stmt = (
                select(Message)
                .where(
                    and_(
                        Message.conversation_id == conversation_id,
                        Message.user_id == user_id,
                    )
                )
                .order_by(Message.created_at.desc())
                .limit(6)
            )
            hist_res = await session.execute(hist_stmt)
            history_rows = list(reversed(hist_res.scalars().all()))

            formatted_history = [
                {"role": m.role, "content": m.content} for m in history_rows if m.role in ["user", "assistant"]
            ]

            budgeted = budget_messages(formatted_history, sys_prompt)

            # 8. Stream LLM generation
            llm = get_llm_provider()
            accumulated_text = []

            async for delta in llm.generate_stream(budgeted):
                accumulated_text.append(delta)
                yield f"event: delta\ndata: {json.dumps({'text': delta})}\n\n"

            full_answer = "".join(accumulated_text).strip()

            # 9. Verify citations against retrieved authorized chunks
            cited_labels = set(re.findall(r"\[(S\d+)\]", full_answer))
            valid_sources = []

            for c in candidates:
                if c["label"] in cited_labels or not cited_labels:
                    valid_sources.append(c)

            # Emit verified sources
            yield f"event: sources\ndata: {json.dumps({'sources': valid_sources})}\n\n"

            # 10. Persist assistant message and verified message sources
            asst_msg = Message(
                id=uuid.uuid4(),
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=full_answer,
                token_count=count_tokens(full_answer),
                status="completed",
            )
            session.add(asst_msg)
            await session.flush()

            for s in valid_sources:
                src_rec = MessageSource(
                    id=uuid.uuid4(),
                    message_id=asst_msg.id,
                    user_id=user_id,
                    document_id=uuid.UUID(s["document_id"]),
                    chunk_id=uuid.UUID(s["chunk_id"]),
                    generation=s["generation"],
                    source_label=s["label"],
                    page_start=s.get("page_start"),
                    page_end=s.get("page_end"),
                    section=s.get("section"),
                    excerpt=s["excerpt"],
                )
                session.add(src_rec)

            # Record usage
            usage = UsageEvent(
                id=uuid.uuid4(),
                user_id=user_id,
                request_id=request_key,
                kind="llm_tokens",
                model=getattr(llm, "model", "mock"),
                input_tokens=count_tokens(sys_prompt) + user_msg.token_count,
                output_tokens=asst_msg.token_count,
            )
            session.add(usage)
            await session.commit()

            # Emit final completion event
            yield f"event: done\ndata: {json.dumps({'status': 'completed', 'message_id': str(asst_msg.id)})}\n\n"

        finally:
            quota_limiter.release_generation_lease()


chat_service = ChatService()

