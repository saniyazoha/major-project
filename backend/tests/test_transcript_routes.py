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
from app.services import transcript_processing_service, storage_service


@pytest.fixture
def transcript_route_setup(monkeypatch):
    # Mock storage upload to prevent network calls during setup
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
    # Seed Student 1 (Ada - Enrolled) and Student 2 (Shannon - Non-enrolled)
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

    # Seed Subject 1 & Batch 1 owned by Fac 1
    sub1 = Subject(name="Operating Systems", faculty_id=fac1.id)
    session.add(sub1)
    session.commit()

    batch1 = Batch(subject_id=sub1.id, batchname="Section-A")
    session.add(batch1)
    session.commit()

    # Seed Subject 2 & Batch 2 owned by Fac 2
    sub2 = Subject(name="Compilers", faculty_id=fac2.id)
    session.add(sub2)
    session.commit()

    batch2 = Batch(subject_id=sub2.id, batchname="Section-B")
    session.add(batch2)
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
    # Seed Lecture 2 under Batch 2 (Fac 2)
    lec2 = Lecture(
        title="Lexical Analysis",
        subject_id=sub2.id,
        batch_id=batch2.id,
        faculty_id=fac2.id,
        original_filename="lexical.mp3",
        file_type="audio/mpeg",
        file_size=2048,
        storage_path="lectures/lexical.mp3",
        status="uploaded"
    )
    session.add_all([lec1, lec2])
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
    stu2_token = security.create_access_token({"sub": str(stu2.id), "username": stu2.username, "role": "student"})

    yield {
        "client": client,
        "session": session,
        "fac1": fac1,
        "fac2": fac2,
        "stu1": stu1,
        "stu2": stu2,
        "batch1": batch1,
        "batch2": batch2,
        "lec1": lec1,
        "lec2": lec2,
        "fac1_headers": {"Authorization": f"Bearer {fac1_token}"},
        "fac2_headers": {"Authorization": f"Bearer {fac2_token}"},
        "stu1_headers": {"Authorization": f"Bearer {stu1_token}"},
        "stu2_headers": {"Authorization": f"Bearer {stu2_token}"},
    }

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_faculty_triggers_transcription_on_own_lecture_success(transcript_route_setup, monkeypatch):
    client = transcript_route_setup["client"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    mock_process = MagicMock()
    monkeypatch.setattr(transcript_processing_service, "process_lecture_transcription", mock_process)

    response = client.post(f"/lectures/{lec1.id}/transcribe", headers=headers)
    assert response.status_code == 202
    data = response.json()
    assert data == {"lecture_id": lec1.id, "status": "processing"}


def test_transcribe_completed_transcript_rejected_409(transcript_route_setup, monkeypatch):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    mock_process = MagicMock()
    monkeypatch.setattr(transcript_processing_service, "process_lecture_transcription", mock_process)

    sample_timestamps = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Raw text"}])
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw uncorrected text.",
        corrected_text="Faculty corrected text.",
        segment_timestamps_json=sample_timestamps,
        status="completed"
    )
    session.add(t)
    session.commit()

    response = client.post(f"/lectures/{lec1.id}/transcribe", headers=headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Transcript already completed; re-transcription not supported in this phase"

    # Assert database fields remain exactly unchanged
    session.refresh(t)
    assert t.raw_text == "Raw uncorrected text."
    assert t.corrected_text == "Faculty corrected text."
    assert t.segment_timestamps_json == sample_timestamps
    assert t.status == "completed"

    # Assert background task was NOT enqueued
    mock_process.assert_not_called()


def test_faculty_triggers_transcription_on_other_faculty_lecture_forbidden(transcript_route_setup):
    client = transcript_route_setup["client"]
    lec1 = transcript_route_setup["lec1"]  # Owned by Fac 1
    headers = transcript_route_setup["fac2_headers"]  # Fac 2 attempting access

    response = client.post(f"/lectures/{lec1.id}/transcribe", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied for this lecture"


def test_student_cannot_trigger_transcription(transcript_route_setup):
    client = transcript_route_setup["client"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["stu1_headers"]

    response = client.post(f"/lectures/{lec1.id}/transcribe", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Faculty access required"


def test_faculty_fetches_transcript_for_own_lecture_success(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    sample_timestamps = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Detailed transcript"}])
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Detailed process scheduling lecture transcript text.",
        corrected_text=None,
        segment_timestamps_json=sample_timestamps,
        status="completed"
    )
    session.add(t)
    session.commit()

    response = client.get(f"/lectures/{lec1.id}/transcript", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == t.id
    assert data["lecture_id"] == lec1.id
    assert data["raw_text"] == "Detailed process scheduling lecture transcript text."
    assert data["corrected_text"] is None
    assert data["segment_timestamps_json"] == sample_timestamps
    assert data["status"] == "completed"
    assert data["error_message"] is None
    assert "created_at" in data
    assert "updated_at" in data


def test_faculty_fetches_transcript_not_found(transcript_route_setup):
    client = transcript_route_setup["client"]
    lec2 = transcript_route_setup["lec2"]
    headers = transcript_route_setup["fac2_headers"]

    response = client.get(f"/lectures/{lec2.id}/transcript", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Transcript not found for this lecture"


def test_student_fetches_transcript_broadcast_enrolled_success(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["stu1_headers"]  # Enrolled student

    # Set lecture status to broadcast
    lec1.status = "broadcast"
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Broadcast lecture transcript text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    response = client.get(f"/lectures/{lec1.id}/transcript", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["lecture_id"] == lec1.id
    assert data["raw_text"] == "Broadcast lecture transcript text."


def test_student_fetches_transcript_non_broadcast_forbidden(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["stu1_headers"]  # Enrolled student

    # Keep lecture status as "uploaded" (not broadcast)
    lec1.status = "uploaded"
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Unbroadcast transcript text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    response = client.get(f"/lectures/{lec1.id}/transcript", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied for this lecture"


def test_non_enrolled_student_fetches_transcript_forbidden(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["stu2_headers"]  # Non-enrolled student

    # Broadcast lecture, but student is NOT enrolled in batch
    lec1.status = "broadcast"
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Broadcast transcript text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    response = client.get(f"/lectures/{lec1.id}/transcript", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied for this lecture"


# =====================================================================
# Phase 2C — Faculty Transcript Review (Save Corrections) Tests (PATCH)
# =====================================================================

def test_faculty_saves_transcript_correction_success(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    sample_timestamps = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Raw text"}])
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw uncorrected ASR transcript text.",
        corrected_text=None,
        segment_timestamps_json=sample_timestamps,
        status="completed"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": "Faculty reviewed and corrected transcript text."}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["lecture_id"] == lec1.id
    assert data["raw_text"] == "Raw uncorrected ASR transcript text."
    assert data["corrected_text"] == "Faculty reviewed and corrected transcript text."
    assert data["segment_timestamps_json"] == sample_timestamps
    assert data["status"] == "completed"
    assert lec1.status == "uploaded"


def test_faculty_saves_transcript_correction_forbidden_other_faculty(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]  # Owned by Fac 1
    headers = transcript_route_setup["fac2_headers"]  # Fac 2 attempting edit

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw ASR transcript.",
        corrected_text=None,
        status="completed"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": "Unauthorized edit attempt."}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied for this lecture"

    # Verify protected fields in DB unchanged
    session.refresh(t)
    assert t.corrected_text is None
    assert t.raw_text == "Raw ASR transcript."


def test_student_cannot_save_transcript_correction(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["stu1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw ASR transcript.",
        corrected_text=None,
        status="completed"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": "Student edit attempt."}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "Faculty access required"

    session.refresh(t)
    assert t.corrected_text is None


def test_transcript_status_processing_rejected_409(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text=None,
        corrected_text=None,
        status="processing"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": "Premature edit attempt."}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Transcript is not completed and cannot be edited"

    session.refresh(t)
    assert t.status == "processing"
    assert t.corrected_text is None


def test_transcript_status_failed_rejected_409(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text=None,
        corrected_text=None,
        status="failed",
        error_message="Groq timeout"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": "Failed transcript edit attempt."}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Transcript is not completed and cannot be edited"

    session.refresh(t)
    assert t.status == "failed"
    assert t.corrected_text is None


def test_save_correction_when_transcript_not_found_rejected_404(transcript_route_setup):
    client = transcript_route_setup["client"]
    lec2 = transcript_route_setup["lec2"]
    headers = transcript_route_setup["fac2_headers"]

    correction_payload = {"corrected_text": "Missing transcript edit attempt."}
    response = client.patch(f"/lectures/{lec2.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Transcript not found for this lecture"


def test_save_correction_empty_string_rejected_422(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw ASR text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": ""}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 422


def test_save_correction_whitespace_only_rejected_422(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw ASR text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    correction_payload = {"corrected_text": "    "}
    response = client.patch(f"/lectures/{lec1.id}/transcript", json=correction_payload, headers=headers)

    assert response.status_code == 422


def test_sequential_corrections_overwrites_previous(transcript_route_setup):
    client = transcript_route_setup["client"]
    session = transcript_route_setup["session"]
    lec1 = transcript_route_setup["lec1"]
    headers = transcript_route_setup["fac1_headers"]

    sample_timestamps = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Raw text"}])
    t = Transcript(
        lecture_id=lec1.id,
        raw_text="Raw uncorrected ASR text.",
        corrected_text=None,
        segment_timestamps_json=sample_timestamps,
        status="completed"
    )
    session.add(t)
    session.commit()

    # First correction
    payload1 = {"corrected_text": "First correction draft."}
    res1 = client.patch(f"/lectures/{lec1.id}/transcript", json=payload1, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["corrected_text"] == "First correction draft."
    assert res1.json()["raw_text"] == "Raw uncorrected ASR text."

    # Second correction
    payload2 = {"corrected_text": "Final polished correction."}
    res2 = client.patch(f"/lectures/{lec1.id}/transcript", json=payload2, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["corrected_text"] == "Final polished correction."
    assert res2.json()["raw_text"] == "Raw uncorrected ASR text."
    assert res2.json()["segment_timestamps_json"] == sample_timestamps
    assert res2.json()["status"] == "completed"
    assert lec1.status == "uploaded"
