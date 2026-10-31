import uuid
import hashlib
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser, create_access_token
from app.repositories.models import Profile, Document, Conversation
from app.services.quotas.limiter import quota_limiter
from app.schemas.auth import MeResponse, UserProfileResponse, UserUsageResponse

router = APIRouter()


class LoginTokenRequest(BaseModel):
    email: str
    password: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    display_name: Optional[str] = None


class LoginTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


@router.post("/auth/token", response_model=LoginTokenResponse)
async def acquire_token(
    body: LoginTokenRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Authenticates or provisions a session, returning a valid signed JWT.
    Supports demo identities and standard email sign-ins.
    """
    if body.user_id:
        user_id = body.user_id
    elif "bob" in body.email.lower():
        user_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
    elif "alice" in body.email.lower():
        user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    else:
        # Deterministic UUID for custom emails in local mode
        hex_md5 = hashlib.md5(body.email.lower().encode("utf-8")).hexdigest()
        user_id = uuid.UUID(hex_md5)

    # Ensure profile exists
    stmt = select(Profile).where(Profile.id == user_id)
    profile = (await session.execute(stmt)).scalar_one_or_none()
    if not profile:
        profile = Profile(
            id=user_id,
            display_name=body.display_name or body.email.split("@")[0],
            preferred_language="en",
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

    access_token = create_access_token(user_id=user_id, email=body.email)

    return LoginTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfileResponse(
            id=profile.id,
            email=body.email,
            display_name=profile.display_name,
            preferred_language=profile.preferred_language,
            created_at=profile.created_at,
        ),
    )


@router.get("/me", response_model=MeResponse)
async def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Fetch or create user profile
    stmt = select(Profile).where(Profile.id == current_user.id)
    res = await session.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        profile = Profile(
            id=current_user.id,
            display_name=current_user.email.split("@")[0] if current_user.email else "User",
            preferred_language="en",
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

    usage_data = await quota_limiter.get_user_usage(session, current_user.id)

    return MeResponse(
        user=UserProfileResponse(
            id=profile.id,
            email=current_user.email,
            display_name=profile.display_name,
            preferred_language=profile.preferred_language,
            created_at=profile.created_at,
        ),
        usage=UserUsageResponse(**usage_data),
    )


@router.delete("/me")
async def delete_account(
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Cascade delete profile, documents, conversations
    docs = (await session.execute(select(Document).where(Document.user_id == current_user.id))).scalars().all()
    for d in docs:
        d.status = "deleting"
        d.deleted_at = d.updated_at

    convs = (await session.execute(select(Conversation).where(Conversation.user_id == current_user.id))).scalars().all()
    for c in convs:
        c.deleted_at = c.updated_at

    prof = (await session.execute(select(Profile).where(Profile.id == current_user.id))).scalar_one_or_none()
    if prof:
        await session.delete(prof)

    await session.commit()
    return {"status": "deleting", "message": "Account marked for purge."}
