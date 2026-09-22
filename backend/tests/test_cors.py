import os
from app.core.config import Settings
from app.main import app
from fastapi.testclient import TestClient


def test_cors_origins_parsing_default():
    """Verify default CORS_ORIGINS is parsed correctly."""
    settings = Settings()
    assert settings.cors_origins_list == ["http://localhost:5173", "http://localhost:5174"]


def test_cors_origins_parsing_multiple():
    """Verify comma-separated CORS_ORIGINS with extra spaces and empty items are trimmed and filtered."""
    os.environ["CORS_ORIGINS"] = " http://localhost:5173 , , http://localhost:5174, http://localhost:3000 "
    try:
        settings = Settings()
        assert settings.cors_origins_list == [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
        ]
    finally:
        os.environ.pop("CORS_ORIGINS", None)


def test_cors_allowed_origin_header_5173(client: TestClient):
    """Verify configured frontend origin http://localhost:5173 is accepted."""
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") is None


def test_cors_allowed_origin_header_5174(client: TestClient):
    """Verify configured frontend origin http://localhost:5174 is accepted."""
    response = client.get("/health", headers={"Origin": "http://localhost:5174"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5174"
    assert response.headers.get("access-control-allow-credentials") is None


def test_cors_unallowed_origin_rejected(client: TestClient):
    """Verify unconfigured origin is NOT returned in access-control-allow-origin header."""
    response = client.get("/health", headers={"Origin": "http://untrusted-origin.com"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") != "http://untrusted-origin.com"


def test_cors_preflight_request_explicit_policy(client: TestClient):
    """Verify OPTIONS preflight request respects explicit allowed methods and headers for localhost:5174."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5174",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5174"
    assert response.headers.get("access-control-allow-credentials") is None

    allowed_methods = response.headers.get("access-control-allow-methods", "")
    assert "POST" in allowed_methods
    assert "*" not in allowed_methods

    allowed_headers = response.headers.get("access-control-allow-headers", "").lower()
    assert "authorization" in allowed_headers
    assert "content-type" in allowed_headers
    assert "*" not in allowed_headers
