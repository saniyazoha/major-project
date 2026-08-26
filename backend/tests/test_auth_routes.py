import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.student import Student
from app.core import security


@pytest.fixture
def auth_client():
    # Use StaticPool to ensure single in-memory SQLite DB across threads
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed faculty and student users
    fac = Faculty(
        name="Prof. Charles Babbage",
        username="babbage",
        password_hash=security.hash_password("DifferenceEngine!1")
    )
    stu = Student(
        name="Grace Hopper",
        rollno="CS2026-02",
        username="ghopper",
        password_hash=security.hash_password("COBOL1959!Key")
    )
    session.add_all([fac, stu])
    session.commit()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_faculty_login_success(auth_client):
    response = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "DifferenceEngine!1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["role"] == "faculty"
    assert data["username"] == "babbage"
    assert data["name"] == "Prof. Charles Babbage"

    # Decode token payload to verify contents
    decoded = security.decode_access_token(data["access_token"])
    assert decoded is not None
    assert decoded["username"] == "babbage"
    assert decoded["role"] == "faculty"


def test_faculty_login_bad_password(auth_client):
    response = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "IncorrectPassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_faculty_login_non_existent_user(auth_client):
    response = auth_client.post(
        "/auth/faculty/login",
        json={"username": "unknown_prof", "password": "DifferenceEngine!1"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_role_separation_faculty_login_with_student_creds(auth_client):
    """Student credentials must fail on faculty login route."""
    response = auth_client.post(
        "/auth/faculty/login",
        json={"username": "ghopper", "password": "COBOL1959!Key"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_student_login_success(auth_client):
    response = auth_client.post(
        "/auth/student/login",
        json={"username": "ghopper", "password": "COBOL1959!Key"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["role"] == "student"
    assert data["username"] == "ghopper"
    assert data["name"] == "Grace Hopper"

    # Decode token payload to verify contents
    decoded = security.decode_access_token(data["access_token"])
    assert decoded is not None
    assert decoded["username"] == "ghopper"
    assert decoded["role"] == "student"


def test_student_login_bad_password(auth_client):
    response = auth_client.post(
        "/auth/student/login",
        json={"username": "ghopper", "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_role_separation_student_login_with_faculty_creds(auth_client):
    """Faculty credentials must fail on student login route."""
    response = auth_client.post(
        "/auth/student/login",
        json={"username": "babbage", "password": "DifferenceEngine!1"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"
