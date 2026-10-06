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
    assert "Incorrect" in response.json()["detail"]


def test_faculty_login_non_existent_user(auth_client):
    response = auth_client.post(
        "/auth/faculty/login",
        json={"username": "unknown_prof", "password": "DifferenceEngine!1"}
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


def test_role_separation_faculty_login_with_student_creds(auth_client):
    """Student credentials must fail on faculty login route."""
    response = auth_client.post(
        "/auth/faculty/login",
        json={"username": "CS2026-02", "password": "COBOL1959!Key"}
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


def test_student_login_success(auth_client):
    """Student login using roll_no / USN and password succeeds."""
    response = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
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


def test_student_login_invalid_usn(auth_client):
    """Student login using non-existent USN / roll_no fails."""
    response = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "INVALID-USN-999", "password": "COBOL1959!Key"}
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


def test_student_login_bad_password(auth_client):
    """Student login using valid USN but wrong password fails."""
    response = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


def test_role_separation_student_login_with_faculty_creds(auth_client):
    """Faculty credentials must fail on student login route."""
    response = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "babbage", "password": "DifferenceEngine!1"}
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


# =========================================================
# PROFILE & PASSWORD TESTS
# =========================================================

def test_student_get_profile(auth_client):
    """Student can retrieve their authenticated profile."""
    login_res = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.get(
        "/auth/student/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Grace Hopper"
    assert data["username"] == "ghopper"
    assert data["role"] == "student"
    assert data["rollno"] == "CS2026-02"


def test_student_update_profile(auth_client):
    """Student can update their name and email."""
    login_res = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.patch(
        "/auth/student/me",
        json={"name": "Rear Admiral Grace Hopper", "email": "grace@navy.mil"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Rear Admiral Grace Hopper"
    assert data["email"] == "grace@navy.mil"

    # Verify email is returned in profile GET
    get_res = auth_client.get(
        "/auth/student/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_res.json()["email"] == "grace@navy.mil"


def test_faculty_update_profile(auth_client):
    """Faculty can update their name and email."""
    login_res = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "DifferenceEngine!1"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.patch(
        "/auth/faculty/me",
        json={"name": "Sir Charles Babbage", "email": "charles@cambridge.ac.uk"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Sir Charles Babbage"
    assert data["email"] == "charles@cambridge.ac.uk"


def test_unauthenticated_profile_update_rejected(auth_client):
    """Unauthenticated profile update is rejected with 401."""
    res = auth_client.patch("/auth/student/me", json={"name": "Attacker"})
    assert res.status_code == 401


def test_student_cannot_access_faculty_profile_endpoint(auth_client):
    """Student token rejected on faculty profile endpoint."""
    login_res = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.patch(
        "/auth/faculty/me",
        json={"name": "Hacker"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


def test_student_change_password_success_and_login_with_new_password(auth_client):
    """Student can change password with valid current password and use new password to log in."""
    login_res = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.post(
        "/auth/student/change-password",
        json={"current_password": "COBOL1959!Key", "new_password": "BrandNewPassword123!"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["message"] == "Password changed successfully"

    # Old password fails
    old_login = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
    )
    assert old_login.status_code == 401

    # New password succeeds
    new_login = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "BrandNewPassword123!"}
    )
    assert new_login.status_code == 200


def test_student_change_password_wrong_current_password_fails(auth_client):
    """Student cannot change password with incorrect current password."""
    login_res = auth_client.post(
        "/auth/student/login",
        json={"roll_no": "CS2026-02", "password": "COBOL1959!Key"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.post(
        "/auth/student/change-password",
        json={"current_password": "WrongPassword", "new_password": "NewSecretPassword"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "Incorrect current password" in res.json()["detail"]


def test_faculty_change_password_success(auth_client):
    """Faculty can change password and log in with new password."""
    login_res = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "DifferenceEngine!1"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.post(
        "/auth/faculty/change-password",
        json={"current_password": "DifferenceEngine!1", "new_password": "AnalyticalEngine!2"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200

    # Old password fails
    old_login = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "DifferenceEngine!1"}
    )
    assert old_login.status_code == 401

    # New password succeeds
    new_login = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "AnalyticalEngine!2"}
    )
    assert new_login.status_code == 200


def test_faculty_change_password_wrong_current_password_fails(auth_client):
    """Faculty cannot change password with wrong current password."""
    login_res = auth_client.post(
        "/auth/faculty/login",
        json={"username": "babbage", "password": "DifferenceEngine!1"}
    )
    token = login_res.json()["access_token"]

    res = auth_client.post(
        "/auth/faculty/change-password",
        json={"current_password": "WrongPass", "new_password": "AnalyticalEngine!2"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "Incorrect current password" in res.json()["detail"]


def test_unauthenticated_password_change_rejected(auth_client):
    """Unauthenticated password change request is rejected."""
    res = auth_client.post(
        "/auth/student/change-password",
        json={"current_password": "COBOL1959!Key", "new_password": "NewSecretPassword"}
    )
    assert res.status_code == 401
