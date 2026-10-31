import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    document_ids: Optional[List[uuid.UUID]] = None
    language: Optional[str] = "en"


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    language: str
    created_at: datetime
    updated_at: datetime
    document_ids: List[uuid.UUID] = []


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    next_cursor: Optional[str] = None
    total: int


class ChatRequest(BaseModel):
    request_key: uuid.UUID = Field(default_factory=uuid.uuid4)
    message: str = Field(..., min_length=1)
    document_ids: Optional[List[uuid.UUID]] = None
    language: Optional[str] = "en"


class MessageSourceResponse(BaseModel):
    label: str
    document_id: uuid.UUID
    document_title: Optional[str] = None
    chunk_id: uuid.UUID
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    section: Optional[str] = None
    excerpt: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    status: str
    created_at: datetime
    sources: Optional[List[MessageSourceResponse]] = None


class MessageListResponse(BaseModel):
    items: List[MessageResponse]
    total: int
