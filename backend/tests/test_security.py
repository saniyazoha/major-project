import pytest
from datetime import timedelta
from app.core import security


def test_password_hashing_and_verification():
    raw_password = "SecurePassword123!"
    hashed = security.hash_password(raw_password)

    assert hashed != raw_password
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert security.verify_password(raw_password, hashed) is True
    assert security.verify_password("WrongPassword!", hashed) is False
    assert security.verify_password("", hashed) is False
    assert security.verify_password(raw_password, "") is False


def test_create_and_decode_access_token():
    payload = {
        "sub": "42",
        "username": "prof_smith",
        "role": "faculty"
    }
    token = security.create_access_token(data=payload)
    assert isinstance(token, str)

    decoded = security.decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["username"] == "prof_smith"
    assert decoded["role"] == "faculty"
    assert "exp" in decoded
    assert "iat" in decoded


def test_expired_access_token():
    payload = {"sub": "1", "username": "testuser", "role": "student"}
    # Create token expired 10 minutes ago
    expired_token = security.create_access_token(data=payload, expires_delta=timedelta(minutes=-10))
    decoded = security.decode_access_token(expired_token)
    assert decoded is None
