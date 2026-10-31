import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    display_name: Optional[str] = None
    preferred_language: str = "en"
    created_at: datetime


class UserUsageResponse(BaseModel):
    storage_bytes_used: int
    storage_bytes_limit: int
    document_count: int
    document_limit: int
    today_requests: int
    daily_request_limit: int


class MeResponse(BaseModel):
    user: UserProfileResponse
    usage: UserUsageResponse

