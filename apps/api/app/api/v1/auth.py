from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.repositories.models import Profile, Document, Conversation
from app.services.quotas.limiter import quota_limiter
from app.schemas.auth import MeResponse, UserProfileResponse, UserUsageResponse

router = APIRouter()


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
