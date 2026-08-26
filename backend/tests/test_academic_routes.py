import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.core import security


@pytest.fixture
def academic_setup():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed Faculty 1 and Faculty 2
    fac1 = Faculty(
        name="Dr. Alan Turing",
        username="turing",
        password_hash=security.hash_password("Pass123!")
    )
    fac2 = Faculty(
        name="Dr. Grace Hopper",
        username="hopper",
        password_hash=security.hash_password("Pass123!")
    )
    # Seed Student 1 and Student 2
    stu1 = Student(
        name="Ada Lovelace",
        rollno="CS101",
        username="ada",
        password_hash=security.hash_password("Pass123!")
    )
    stu2 = Student(
        name="Claude Shannon",
        rollno="CS102",
        username="shannon",
        password_hash=security.hash_password("Pass123!")
    )
    session.add_all([fac1, fac2, stu1, stu2])
    session.commit()

    # Generate JWT tokens
    fac1_token = security.create_access_token({"sub": str(fac1.id), "username": fac1.username, "role": "faculty"})
    fac2_token = security.create_access_token({"sub": str(fac2.id), "username": fac2.username, "role": "faculty"})
    stu1_token = security.create_access_token({"sub": str(stu1.id), "username": stu1.username, "role": "student"})
    stu2_token = security.create_access_token({"sub": str(stu2.id), "username": stu2.username, "role": "student"})

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    yield {
        "client": client,
        "fac1": fac1,
        "fac2": fac2,
        "stu1": stu1,
        "stu2": stu2,
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
        "session": session,
    }

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_faculty_can_create_subject(academic_setup):
    client = academic_setup["client"]
    token = academic_setup["fac1_token"]

    response = client.post(
        "/subjects",
        json={"name": "Computer Architecture"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Computer Architecture"
    assert data["faculty_id"] == academic_setup["fac1"].id


def test_student_cannot_create_subject(academic_setup):
    client = academic_setup["client"]
    token = academic_setup["stu1_token"]

    response = client.post(
        "/subjects",
        json={"name": "Hacking 101"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Faculty access required"


def test_faculty_sees_only_own_subjects(academic_setup):
    client = academic_setup["client"]
    fac1_token = academic_setup["fac1_token"]
    fac2_token = academic_setup["fac2_token"]

    # Fac1 creates Subject 1
    client.post(
        "/subjects",
        json={"name": "Turing Machines"},
        headers={"Authorization": f"Bearer {fac1_token}"}
    )
    # Fac2 creates Subject 2
    client.post(
        "/subjects",
        json={"name": "COBOL Design"},
        headers={"Authorization": f"Bearer {fac2_token}"}
    )

    # Fac1 listing subjects should only return Subject 1
    res1 = client.get("/subjects", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res1.status_code == 200
    subjects1 = res1.json()
    assert len(subjects1) == 1
    assert subjects1[0]["name"] == "Turing Machines"

    # Fac2 listing subjects should only return Subject 2
    res2 = client.get("/subjects", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res2.status_code == 200
    subjects2 = res2.json()
    assert len(subjects2) == 1
    assert subjects2[0]["name"] == "COBOL Design"


def test_student_sees_only_enrolled_subjects(academic_setup):
    client = academic_setup["client"]
    fac1_token = academic_setup["fac1_token"]
    stu1_token = academic_setup["stu1_token"]
    stu2_token = academic_setup["stu2_token"]

    # Fac1 creates Subject & Batch A
    sub_res = client.post("/subjects", json={"name": "Discrete Math"}, headers={"Authorization": f"Bearer {fac1_token}"})
    sub_id = sub_res.json()["id"]
    batch_res = client.post(f"/subjects/{sub_id}/batches", json={"batchname": "Section A"}, headers={"Authorization": f"Bearer {fac1_token}"})
    batch_id = batch_res.json()["id"]

    # Enroll stu1 into Batch A
    client.post(f"/batches/{batch_id}/enrollments", json={"student_id": academic_setup["stu1"].id}, headers={"Authorization": f"Bearer {fac1_token}"})

    # stu1 sees Discrete Math
    res_stu1 = client.get("/subjects", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_stu1.status_code == 200
    assert len(res_stu1.json()) == 1
    assert res_stu1.json()[0]["name"] == "Discrete Math"

    # stu2 (not enrolled) sees 0 subjects
    res_stu2 = client.get("/subjects", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res_stu2.status_code == 200
    assert len(res_stu2.json()) == 0


def test_faculty_create_batch_under_own_subject(academic_setup):
    client = academic_setup["client"]
    token = academic_setup["fac1_token"]

    sub_res = client.post("/subjects", json={"name": "Algorithms"}, headers={"Authorization": f"Bearer {token}"})
    sub_id = sub_res.json()["id"]

    batch_res = client.post(f"/subjects/{sub_id}/batches", json={"batchname": "Batch-2026"}, headers={"Authorization": f"Bearer {token}"})
    assert batch_res.status_code == 201
    data = batch_res.json()
    assert data["batchname"] == "Batch-2026"
    assert data["subject_id"] == sub_id


def test_faculty_cannot_create_batch_under_other_faculty_subject(academic_setup):
    client = academic_setup["client"]
    fac1_token = academic_setup["fac1_token"]
    fac2_token = academic_setup["fac2_token"]

    sub_res = client.post("/subjects", json={"name": "Quantum Computing"}, headers={"Authorization": f"Bearer {fac1_token}"})
    sub_id = sub_res.json()["id"]

    # fac2 attempts to create batch under fac1's subject
    batch_res = client.post(f"/subjects/{sub_id}/batches", json={"batchname": "Unauthorized Batch"}, headers={"Authorization": f"Bearer {fac2_token}"})
    assert batch_res.status_code == 403
    assert batch_res.json()["detail"] == "You do not own this subject"


def test_faculty_can_enroll_student_and_duplicate_rejected(academic_setup):
    client = academic_setup["client"]
    token = academic_setup["fac1_token"]
    stu_id = academic_setup["stu1"].id

    sub_res = client.post("/subjects", json={"name": "Operating Systems"}, headers={"Authorization": f"Bearer {token}"})
    sub_id = sub_res.json()["id"]
    batch_res = client.post(f"/subjects/{sub_id}/batches", json={"batchname": "OS-1"}, headers={"Authorization": f"Bearer {token}"})
    batch_id = batch_res.json()["id"]

    # First enrollment succeeds
    enr1 = client.post(f"/batches/{batch_id}/enrollments", json={"student_id": stu_id}, headers={"Authorization": f"Bearer {token}"})
    assert enr1.status_code == 201
    assert enr1.json()["student_id"] == stu_id
    assert enr1.json()["batch_id"] == batch_id

    # Duplicate enrollment fails with HTTP 400
    enr2 = client.post(f"/batches/{batch_id}/enrollments", json={"student_id": stu_id}, headers={"Authorization": f"Bearer {token}"})
    assert enr2.status_code == 400
    assert enr2.json()["detail"] == "Student is already enrolled in this batch"


def test_faculty_cannot_enroll_in_other_faculty_batch(academic_setup):
    client = academic_setup["client"]
    fac1_token = academic_setup["fac1_token"]
    fac2_token = academic_setup["fac2_token"]
    stu_id = academic_setup["stu1"].id

    sub_res = client.post("/subjects", json={"name": "Networks"}, headers={"Authorization": f"Bearer {fac1_token}"})
    sub_id = sub_res.json()["id"]
    batch_res = client.post(f"/subjects/{sub_id}/batches", json={"batchname": "Net-A"}, headers={"Authorization": f"Bearer {fac1_token}"})
    batch_id = batch_res.json()["id"]

    # fac2 tries to enroll student into fac1's batch
    enr = client.post(f"/batches/{batch_id}/enrollments", json={"student_id": stu_id}, headers={"Authorization": f"Bearer {fac2_token}"})
    assert enr.status_code == 403
    assert enr.json()["detail"] == "You do not own the subject for this batch"


def test_faculty_view_students_in_batch(academic_setup):
    client = academic_setup["client"]
    fac1_token = academic_setup["fac1_token"]
    fac2_token = academic_setup["fac2_token"]
    stu1_id = academic_setup["stu1"].id
    stu2_id = academic_setup["stu2"].id

    sub_res = client.post("/subjects", json={"name": "Compiler Design"}, headers={"Authorization": f"Bearer {fac1_token}"})
    sub_id = sub_res.json()["id"]
    batch_res = client.post(f"/subjects/{sub_id}/batches", json={"batchname": "CD-1"}, headers={"Authorization": f"Bearer {fac1_token}"})
    batch_id = batch_res.json()["id"]

    client.post(f"/batches/{batch_id}/enrollments", json={"student_id": stu1_id}, headers={"Authorization": f"Bearer {fac1_token}"})
    client.post(f"/batches/{batch_id}/enrollments", json={"student_id": stu2_id}, headers={"Authorization": f"Bearer {fac1_token}"})

    # fac1 can view students in batch
    res1 = client.get(f"/batches/{batch_id}/students", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res1.status_code == 200
    students = res1.json()
    assert len(students) == 2
    student_names = {s["name"] for s in students}
    assert "Ada Lovelace" in student_names
    assert "Claude Shannon" in student_names

    # fac2 cannot view students in fac1's batch
    res2 = client.get(f"/batches/{batch_id}/students", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res2.status_code == 403
    assert res2.json()["detail"] == "You do not own the subject for this batch"


def test_missing_invalid_expired_jwt(academic_setup):
    client = academic_setup["client"]

    # Missing Authorization header
    r1 = client.get("/subjects")
    assert r1.status_code == 401
    assert r1.json()["detail"] == "Not authenticated"

    # Invalid token string
    r2 = client.get("/subjects", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert r2.status_code == 401
    assert r2.json()["detail"] == "Invalid or expired token"

    # Expired JWT token
    expired_token = security.create_access_token({"sub": "1", "username": "turing", "role": "faculty"}, expires_delta=timedelta(minutes=-10))
    r3 = client.get("/subjects", headers={"Authorization": f"Bearer {expired_token}"})
    assert r3.status_code == 401
    assert r3.json()["detail"] == "Invalid or expired token"
