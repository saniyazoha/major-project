from app.main import app


def test_fastapi_app_import():
    """Verify FastAPI application imports successfully."""
    assert app is not None
    assert app.title == "SABHA API"


def test_health_endpoint(client):
    """Verify /health returns HTTP 200 and {'status': 'ok'}."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
