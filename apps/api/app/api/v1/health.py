from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
@router.get("/live")
async def health_live():
    return {"status": "ok", "service": "personal-rag-api"}


@router.get("/ready")
async def health_ready(session: AsyncSession = Depends(get_db)):
    try:
        # Check database connection
        await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    if not db_ok:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "database": "unavailable"},
        )

    return {"status": "ready", "database": "connected"}

