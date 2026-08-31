import json
import pytest
from unittest.mock import MagicMock
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
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.core import security
from app.services import generation_service, storage_service


@pytest.fixture
def generation_route_setup(monkeypatch):
    monkeypatch.setattr(storage_service, "upload_lecture_file", lambda **kw: "lectures/mock.mp3")

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed Faculty 1 (Turing) and Faculty 2 (Hopper)
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
    # Seed Student 1 (Ada)
    stu1 = Student(
        name="Ada Lovelace",
        rollno="CS101",
        username="ada",
        password_hash=security.hash_password("Pass123!")
    )
    session.add_all([fac1, fac2, stu1])
    session.commit()

    # Seed Subject 1 & Batch 1 owned by Fac 1
    sub1 = Subject(name="Operating Systems", faculty_id=fac1.id)
    session.add(sub1)
    session.commit()

    batch1 = Batch(subject_id=sub1.id, batchname="Section-A")
    session.add(batch1)
    session.commit()

    # Enroll Student 1 in Batch 1
    enr1 = Enrollment(student_id=stu1.id, batch_id=batch1.id)
    session.add(enr1)
    session.commit()

    # Seed Lecture 1 under Batch 1 (Fac 1)
    lec1 = Lecture(
        title="Process Scheduling",
        subject_id=sub1.id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="scheduling.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/scheduling.mp3",
        status="uploaded"
    )
    session.add(lec1)
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    fac1_token = security.create_access_token({"sub": str(fac1.id), "username": fac1.username, "role": "faculty"})
    fac2_token = security.create_access_token({"sub": str(fac2.id), "username": fac2.username, "role": "faculty"})
    stu1_token = security.create_access_token({"sub": str(stu1.id), "username": stu1.username, "role": "student"})

    yield {
        "client": client,
        "session": session,
        "fac1": fac1,
        "fac2": fac2,
        "stu1": stu1,
        "lec1": lec1,
        "fac1_headers": {"Authorization": f"Bearer {fac1_token}"},
        "fac2_headers": {"Authorization": f"Bearer {fac2_token}"},
        "stu1_headers": {"Authorization": f"Bearer {stu1_token}"},
    }

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_student_cannot_trigger_generation(generation_route_setup):
    """Verify non-faculty (student) user is rejected with 403 when attempting to trigger generation."""
    client = generation_route_setup["client"]
    lec1 = generation_route_setup["lec1"]
    headers = generation_route_setup["stu1_headers"]

    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Faculty access required"


def test_faculty_trigger_generation_other_faculty_lecture_forbidden(generation_route_setup):
    """Verify faculty cannot trigger generation for another faculty member's lecture (403 Forbidden)."""
    client = generation_route_setup["client"]
    lec1 = generation_route_setup["lec1"]
    headers = generation_route_setup["fac2_headers"]

    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied for this lecture"


def test_trigger_generation_missing_or_incomplete_transcript_rejected_409(generation_route_setup, monkeypatch):
    """Verify triggering generation when transcript is missing or not completed returns 409 Conflict and task is NOT queued."""
    client = generation_route_setup["client"]
    session = generation_route_setup["session"]
    lec1 = generation_route_setup["lec1"]
    headers = generation_route_setup["fac1_headers"]

    mock_add_task = MagicMock()
    monkeypatch.setattr("fastapi.BackgroundTasks.add_task", mock_add_task)

    # 1. No transcript exists
    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Transcript is missing or not completed for generation"
    mock_add_task.assert_not_called()

    # 2. Transcript exists but status is 'processing'
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="In-progress text.",
        status="processing"
    )
    session.add(t)
    session.commit()

    response2 = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response2.status_code == 409
    assert response2.json()["detail"] == "Transcript is missing or not completed for generation"
    mock_add_task.assert_not_called()


def test_trigger_generation_blocked_when_lecture_status_is_draft_or_broadcast(generation_route_setup, monkeypatch):
    """Verify generation request on lecture in 'draft' or 'broadcast' status returns 409 Conflict and task is NOT queued."""
    client = generation_route_setup["client"]
    session = generation_route_setup["session"]
    lec1 = generation_route_setup["lec1"]
    headers = generation_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Sample completed transcript text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    mock_add_task = MagicMock()
    monkeypatch.setattr("fastapi.BackgroundTasks.add_task", mock_add_task)

    # 1. Status == 'draft'
    lec1.status = "draft"
    session.commit()

    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Generation not allowed for lecture in status 'draft'"
    mock_add_task.assert_not_called()

    # 2. Status == 'broadcast'
    lec1.status = "broadcast"
    session.commit()

    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Generation not allowed for lecture in status 'broadcast'"
    mock_add_task.assert_not_called()


def test_trigger_generation_success_when_status_is_uploaded(generation_route_setup, monkeypatch):
    """Verify generation request returns 202 Accepted and queues background task when status is 'uploaded' and transcript is completed."""
    client = generation_route_setup["client"]
    session = generation_route_setup["session"]
    lec1 = generation_route_setup["lec1"]
    headers = generation_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Completed transcript text for generation test.",
        status="completed"
    )
    session.add(t)
    lec1.status = "uploaded"
    session.commit()

    mock_add_task = MagicMock()
    monkeypatch.setattr("fastapi.BackgroundTasks.add_task", mock_add_task)

    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 202
    assert response.json()["lecture_id"] == lec1.id
    mock_add_task.assert_called_once()
    assert mock_add_task.call_args[0][0] == generation_service.process_lecture_generation


def test_trigger_generation_success_when_status_is_generation_failed(generation_route_setup, monkeypatch):
    """Verify generation request returns 202 Accepted and queues background task when status is 'generation_failed'."""
    client = generation_route_setup["client"]
    session = generation_route_setup["session"]
    lec1 = generation_route_setup["lec1"]
    headers = generation_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Completed transcript text for retry generation test.",
        status="completed"
    )
    session.add(t)
    lec1.status = "generation_failed"
    lec1.generation_error_message = "Previous failure message"
    session.commit()

    mock_add_task = MagicMock()
    monkeypatch.setattr("fastapi.BackgroundTasks.add_task", mock_add_task)

    response = client.post(f"/lectures/{lec1.id}/generate", headers=headers)
    assert response.status_code == 202
    assert response.json()["lecture_id"] == lec1.id
    mock_add_task.assert_called_once()
