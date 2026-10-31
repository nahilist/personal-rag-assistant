import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class UploadReservationRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    byte_size: int = Field(..., gt=0)
    mime_type: str = Field(..., min_length=3)


class UploadReservationResponse(BaseModel):
    document_id: uuid.UUID
    storage_key: str
    upload_url: str
    expires_in_seconds: int = 900


class CompleteUploadRequest(BaseModel):
    checksum: Optional[str] = None


class DocumentItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    mime_type: str
    byte_size: int
    status: str
    active_generation: int
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: List[DocumentItemResponse]
    next_cursor: Optional[str] = None
    total: int


class DocumentSourceResponse(BaseModel):
    document_id: uuid.UUID
    title: str
    content: str
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    section: Optional[str] = None

