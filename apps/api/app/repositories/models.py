import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    ForeignKey,
    DateTime,
    ForeignKeyConstraint,
    UniqueConstraint,
    Text,
    TypeDecorator,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.types import TypeDecorator, CHAR, JSON
from app.core.database import Base


# Universal UUID Type that supports both PostgreSQL and SQLite
class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


# Universal Vector Type
class VectorType(TypeDecorator):
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(384))
            except ImportError:
                return dialect.type_descriptor(Text)
        return dialect.type_descriptor(Text)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if isinstance(value, list):
            return json.dumps(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return [float(x.strip()) for x in value.strip("[]").split(",") if x.strip()]
        return list(value)


def utc_now():
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    display_name = Column(String(255), nullable=True)
    preferred_language = Column(String(10), default="en", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class Document(Base):
    __tablename__ = "documents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    storage_key = Column(String(1024), nullable=False)
    mime_type = Column(String(100), nullable=False)
    byte_size = Column(BigInteger, default=0, nullable=False)
    checksum = Column(String(64), nullable=True)
    status = Column(String(50), default="uploading", nullable=False)
    failure_code = Column(String(50), nullable=True)
    failure_message = Column(Text, nullable=True)
    active_generation = Column(Integer, default=1, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_documents_id_user_id"),
    )


class DocumentGeneration(Base):
    __tablename__ = "document_generations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    document_id = Column(GUID, nullable=False)
    user_id = Column(GUID, nullable=False)
    generation = Column(Integer, nullable=False)
    embedding_model = Column(String(100), nullable=False)
    embedding_revision = Column(String(50), nullable=False)
    dimensions = Column(Integer, nullable=False)
    chunker_version = Column(String(50), nullable=False)
    state = Column(String(50), default="staging", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    activated_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ["document_id", "user_id"],
            ["documents.id", "documents.user_id"],
            ondelete="CASCADE",
            name="fk_docgen_document_user",
        ),
        UniqueConstraint("document_id", "generation", name="uq_docgen_doc_gen"),
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False, index=True)
    document_id = Column(GUID, nullable=False)
    generation = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(VectorType, nullable=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True)
    token_count = Column(Integer, default=0, nullable=False)
    content_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ["document_id", "user_id"],
            ["documents.id", "documents.user_id"],
            ondelete="CASCADE",
            name="fk_docchunks_document_user",
        ),
        UniqueConstraint("document_id", "generation", "chunk_index", name="uq_chunks_doc_gen_index"),
    )


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False)
    document_id = Column(GUID, nullable=False)
    generation = Column(Integer, nullable=False)
    stage = Column(String(50), default="queued", nullable=False)
    attempt = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    lease_until = Column(DateTime(timezone=True), nullable=True)
    next_attempt_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ["document_id", "user_id"],
            ["documents.id", "documents.user_id"],
            ondelete="CASCADE",
            name="fk_jobs_document_user",
        ),
    )


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False)
    entity_id = Column(GUID, nullable=False)
    payload = Column(JSON, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False, index=True)
    title = Column(String(255), default="New Conversation", nullable=False)
    language = Column(String(20), default="en", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_conversations_id_user_id"),
    )


class ConversationDocument(Base):
    __tablename__ = "conversation_documents"

    conversation_id = Column(GUID, primary_key=True)
    document_id = Column(GUID, primary_key=True)
    user_id = Column(GUID, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ["conversation_id", "user_id"],
            ["conversations.id", "conversations.user_id"],
            ondelete="CASCADE",
            name="fk_convdocs_conversation_user",
        ),
        ForeignKeyConstraint(
            ["document_id", "user_id"],
            ["documents.id", "documents.user_id"],
            ondelete="CASCADE",
            name="fk_convdocs_document_user",
        ),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    conversation_id = Column(GUID, nullable=False)
    user_id = Column(GUID, nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    status = Column(String(50), default="completed", nullable=False)  # pending, streaming, completed, failed, cancelled
    request_key = Column(GUID, nullable=True)
    token_count = Column(Integer, default=0, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ["conversation_id", "user_id"],
            ["conversations.id", "conversations.user_id"],
            ondelete="CASCADE",
            name="fk_messages_conversation_user",
        ),
        UniqueConstraint("user_id", "request_key", name="uq_messages_user_request_key"),
    )


class MessageSource(Base):
    __tablename__ = "message_sources"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    message_id = Column(GUID, nullable=False, index=True)
    user_id = Column(GUID, nullable=False)
    document_id = Column(GUID, nullable=False)
    chunk_id = Column(GUID, nullable=False)
    generation = Column(Integer, nullable=False)
    source_label = Column(String(20), nullable=False)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True)
    excerpt = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ["document_id", "user_id"],
            ["documents.id", "documents.user_id"],
            ondelete="CASCADE",
            name="fk_sources_document_user",
        ),
    )


class QuotaReservation(Base):
    __tablename__ = "quota_reservations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)  # storage_bytes, document_count
    units = Column(BigInteger, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    state = Column(String(20), default="active", nullable=False)  # active, committed, released
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False, index=True)
    request_id = Column(GUID, nullable=True)
    kind = Column(String(50), nullable=False)  # llm_tokens, embedding_tokens, storage_bytes
    model = Column(String(100), nullable=True)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    units = Column(BigInteger, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    actor_id = Column(GUID, nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(GUID, nullable=True)
    request_id = Column(GUID, nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
