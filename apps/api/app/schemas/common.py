from typing import Optional, Any
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: Optional[str] = None
    retryable: bool = False


class ErrorResponse(BaseModel):
    error: ErrorDetail

