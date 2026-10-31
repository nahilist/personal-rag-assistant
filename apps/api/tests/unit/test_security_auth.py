import uuid
from datetime import timedelta
import pytest
from fastapi import HTTPException
from app.core.security import create_access_token, verify_jwt_token


def test_valid_jwt_token():
    test_id = uuid.uuid4()
    token = create_access_token(user_id=test_id, email="alice@test.com")
    user = verify_jwt_token(token)
    assert user.id == test_id
    assert user.email == "alice@test.com"


def test_expired_jwt_token():
    test_id = uuid.uuid4()
    # Expired 1 hour ago
    token = create_access_token(user_id=test_id, expires_delta=timedelta(hours=-1))
    with pytest.raises(HTTPException) as exc_info:
        verify_jwt_token(token)
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_tampered_jwt_token():
    test_id = uuid.uuid4()
    token = create_access_token(user_id=test_id)
    # Alter token signature
    tampered = token[:-4] + "abcd"
    with pytest.raises(HTTPException) as exc_info:
        verify_jwt_token(tampered)
    assert exc_info.value.status_code == 401

