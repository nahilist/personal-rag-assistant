import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict
from app.core.config import settings
from app.core.logging import logger

security_scheme = HTTPBearer(auto_error=True)


class AuthenticatedUser(BaseModel):
    model_config = ConfigDict(frozen=True)
    id: uuid.UUID
    email: Optional[str] = None


def create_access_token(
    user_id: uuid.UUID,
    email: str = "",
    expires_delta: Optional[timedelta] = None,
    secret: Optional[str] = None,
    algorithm: str = "HS256"
) -> str:
    """Helper to create a valid signed JWT for testing and development."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta if expires_delta else timedelta(hours=2))
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": settings.SUPABASE_JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if settings.SUPABASE_JWT_ISSUER:
        payload["iss"] = settings.SUPABASE_JWT_ISSUER

    key = secret or settings.SUPABASE_JWT_SECRET
    return jwt.encode(payload, key, algorithm=algorithm)


def verify_jwt_token(token: str) -> AuthenticatedUser:
    """
    Verifies JWT token signature, expiry, audience and issuer.
    Extracts user_id from sub claim.
    """
    try:
        # For development / HMAC secrets:
        # In Supabase production with JWKS, jwt.decode with PyJWKClient can be used
        decode_kwargs = {
            "key": settings.SUPABASE_JWT_SECRET,
            "algorithms": ["HS256"],
            "audience": settings.SUPABASE_JWT_AUDIENCE,
            "options": {"verify_signature": True, "verify_aud": True, "verify_exp": True}
        }
        if settings.SUPABASE_JWT_ISSUER:
            decode_kwargs["issuer"] = settings.SUPABASE_JWT_ISSUER
            decode_kwargs["options"]["verify_iss"] = True

        payload = jwt.decode(token, **decode_kwargs)
        user_id_str = payload.get("sub") or payload.get("uid")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user identity subject (sub)",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            user_uuid = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user identity format in token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthenticatedUser(id=user_uuid, email=payload.get("email"))

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> AuthenticatedUser:
    return verify_jwt_token(credentials.credentials)
