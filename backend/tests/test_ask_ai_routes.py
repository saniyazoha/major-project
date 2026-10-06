import json
import pytest
from unittest.mock import patch, MagicMock
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
from app.services.generation_service import GenerationError


@pytest.fixture
def ask_ai_setup():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed Faculty (Turing)
    fac = Faculty(
        name="Dr. Alan Turing",
        username="turing",
        password_hash=security.hash_password("Pass123!"),
    )
    session.add(fac)
    session.commit()

    # Seed Student 1 (Ada - Enrolled) and Student 2 (Charles - Non-enrolled)
    stu_enrolled = Student(
        name="Ada Lovelace",
        rollno="CS101",
        username="ada",
        password_hash=security.hash_password("Pass123!"),
    )
    stu_not_enrolled = Student(
        name="Charles Babbage",
        rollno="CS102",
        username="charles",
        password_hash=security.hash_password("Pass123!"),
    )
    session.add_all([stu_enrolled, stu_not_enrolled])
    session.commit()

    # Subject & Batch
    sub = Subject(name="Operating Systems", faculty_id=fac.id)
    session.add(sub)
    session.commit()

    batch = Batch(subject_id=sub.id, batchname="Batch-A")
    session.add(batch)
    session.commit()

    # Enroll Ada into Batch-A
    enrollment = Enrollment(batch_id=batch.id, student_id=stu_enrolled.id)
    session.add(enrollment)
    session.commit()

    # Broadcast Lecture
    lec_broadcast = Lecture(
        title="CPU Scheduling",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="cpu.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/cpu.mp3",
        status="broadcast",
    )
    # Draft Lecture (non-broadcast)
    lec_draft = Lecture(
        title="Memory Management",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="memory.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/memory.mp3",
        status="draft",
    )
    session.add_all([lec_broadcast, lec_draft])
    session.commit()

    # Completed Transcript for broadcast lecture
    transcript_completed = Transcript(
        lecture_id=lec_broadcast.id,
        raw_text="Raw lecture transcript about CPU scheduling.",
        corrected_text="Corrected lecture transcript about round robin scheduling.",
        status="completed",
    )
    session.add(transcript_completed)
    session.commit()

    # Override get_db dependency
    def _get_db_override():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    client = TestClient(app)

    # Tokens
    token_enrolled = security.create_access_token({"sub": str(stu_enrolled.id), "username": "ada", "role": "student"})
    token_not_enrolled = security.create_access_token({"sub": str(stu_not_enrolled.id), "username": "charles", "role": "student"})
    token_faculty = security.create_access_token({"sub": str(fac.id), "username": "turing", "role": "faculty"})

    yield {
        "client": client,
        "session": session,
        "faculty": fac,
        "student_enrolled": stu_enrolled,
        "student_not_enrolled": stu_not_enrolled,
        "lecture_broadcast": lec_broadcast,
        "lecture_draft": lec_draft,
        "transcript_completed": transcript_completed,
        "headers_enrolled": {"Authorization": f"Bearer {token_enrolled}"},
        "headers_not_enrolled": {"Authorization": f"Bearer {token_not_enrolled}"},
        "headers_faculty": {"Authorization": f"Bearer {token_faculty}"},
    }

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_ask_ai_enrolled_student_broadcast_lecture_success(ask_ai_setup):
    """Test 1: Enrolled student can ask AI about a broadcast lecture with completed transcript."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_enrolled"]

    mock_llm_response = json.dumps({"answer": "Round robin assigns time slices to each process."})

    with patch("app.services.generation_service.call_groq_llm", return_value=mock_llm_response):
        res = client.post(
            f"/lectures/{lec_id}/ask-ai",
            json={"question": "What is round robin?"},
            headers=headers,
        )

    assert res.status_code == 200
    data = res.json()
    assert data["answer"] == "Round robin assigns time slices to each process."


def test_ask_ai_non_enrolled_student_forbidden(ask_ai_setup):
    """Test 2: Non-enrolled student cannot ask about the lecture."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_not_enrolled"]

    res = client.post(
        f"/lectures/{lec_id}/ask-ai",
        json={"question": "What is round robin?"},
        headers=headers,
    )

    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_ask_ai_non_broadcast_lecture_forbidden(ask_ai_setup):
    """Test 3: Student cannot ask about a non-broadcast (draft/uploaded) lecture."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_draft"].id
    headers = ask_ai_setup["headers_enrolled"]

    res = client.post(
        f"/lectures/{lec_id}/ask-ai",
        json={"question": "Explain memory management."},
        headers=headers,
    )

    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_ask_ai_missing_transcript_conflict(ask_ai_setup):
    """Test 4: Missing transcript returns 409 Conflict."""
    client = ask_ai_setup["client"]
    session = ask_ai_setup["session"]
    fac = ask_ai_setup["faculty"]
    lec_broadcast = ask_ai_setup["lecture_broadcast"]
    headers = ask_ai_setup["headers_enrolled"]

    # Create another broadcast lecture without a transcript
    no_trans_lec = Lecture(
        title="Deadlocks",
        subject_id=lec_broadcast.subject_id,
        batch_id=lec_broadcast.batch_id,
        faculty_id=fac.id,
        original_filename="deadlock.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/deadlock.mp3",
        status="broadcast",
    )
    session.add(no_trans_lec)
    session.commit()

    res = client.post(
        f"/lectures/{no_trans_lec.id}/ask-ai",
        json={"question": "What is deadlock?"},
        headers=headers,
    )

    assert res.status_code == 409
    assert "Transcript is missing or not completed" in res.json()["detail"]


def test_ask_ai_incomplete_transcript_status_conflict(ask_ai_setup):
    """Test 5: Transcript with incomplete (processing/failed) status returns 409 Conflict."""
    client = ask_ai_setup["client"]
    session = ask_ai_setup["session"]
    fac = ask_ai_setup["faculty"]
    lec_broadcast = ask_ai_setup["lecture_broadcast"]
    headers = ask_ai_setup["headers_enrolled"]

    proc_lec = Lecture(
        title="Concurrency",
        subject_id=lec_broadcast.subject_id,
        batch_id=lec_broadcast.batch_id,
        faculty_id=fac.id,
        original_filename="conc.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/conc.mp3",
        status="broadcast",
    )
    session.add(proc_lec)
    session.commit()

    proc_trans = Transcript(
        lecture_id=proc_lec.id,
        raw_text="Processing text...",
        status="processing",
    )
    session.add(proc_trans)
    session.commit()

    res = client.post(
        f"/lectures/{proc_lec.id}/ask-ai",
        json={"question": "What is concurrency?"},
        headers=headers,
    )

    assert res.status_code == 409
    assert "Transcript is missing or not completed" in res.json()["detail"]


def test_ask_ai_authentication_enforced(ask_ai_setup):
    """Test 6: Authentication is enforced (unauthenticated requests rejected)."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id

    res = client.post(
        f"/lectures/{lec_id}/ask-ai",
        json={"question": "What is scheduling?"},
    )

    assert res.status_code == 401
    assert "Not authenticated" in res.json()["detail"]


def test_ask_ai_uses_corrected_transcript_when_present(ask_ai_setup):
    """Test 7: Uses corrected_text when corrected_text exists."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_enrolled"]

    mock_llm = MagicMock(return_value=json.dumps({"answer": "Answer based on corrected text."}))

    with patch("app.services.generation_service.call_groq_llm", mock_llm):
        res = client.post(
            f"/lectures/{lec_id}/ask-ai",
            json={"question": "Explain round robin"},
            headers=headers,
        )

    assert res.status_code == 200
    mock_llm.assert_called_once()
    prompt_used = mock_llm.call_args[0][0]
    assert "Corrected lecture transcript about round robin scheduling." in prompt_used
    assert "Raw lecture transcript" not in prompt_used


def test_ask_ai_falls_back_to_raw_transcript_when_corrected_is_none(ask_ai_setup):
    """Test 8: Falls back to raw_text when corrected_text is None."""
    client = ask_ai_setup["client"]
    session = ask_ai_setup["session"]
    transcript = ask_ai_setup["transcript_completed"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_enrolled"]

    # Set corrected_text to None
    transcript.corrected_text = None
    session.commit()

    mock_llm = MagicMock(return_value=json.dumps({"answer": "Answer based on raw text."}))

    with patch("app.services.generation_service.call_groq_llm", mock_llm):
        res = client.post(
            f"/lectures/{lec_id}/ask-ai",
            json={"question": "Explain raw transcript"},
            headers=headers,
        )

    assert res.status_code == 200
    mock_llm.assert_called_once()
    prompt_used = mock_llm.call_args[0][0]
    assert "Raw lecture transcript about CPU scheduling." in prompt_used


def test_ask_ai_llm_failure_returns_500(ask_ai_setup):
    """Test 9: LLM failure is caught and converted to 500 HTTP exception."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_enrolled"]

    with patch("app.services.generation_service.call_groq_llm", side_effect=GenerationError("Groq API timeout")):
        res = client.post(
            f"/lectures/{lec_id}/ask-ai",
            json={"question": "What is round robin?"},
            headers=headers,
        )

    assert res.status_code == 500
    assert "LLM generation failed" in res.json()["detail"]


def test_ask_ai_faculty_forbidden(ask_ai_setup):
    """Test 10: Faculty/non-student cannot use the student Ask AI endpoint."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_faculty"]

    res = client.post(
        f"/lectures/{lec_id}/ask-ai",
        json={"question": "Can faculty ask AI?"},
        headers=headers,
    )

    assert res.status_code == 403
    assert "Student access required" in res.json()["detail"]


def test_ask_ai_empty_question_bad_request(ask_ai_setup):
    """Test 11: Empty or whitespace question returns 400 Bad Request."""
    client = ask_ai_setup["client"]
    lec_id = ask_ai_setup["lecture_broadcast"].id
    headers = ask_ai_setup["headers_enrolled"]

    res = client.post(
        f"/lectures/{lec_id}/ask-ai",
        json={"question": "   "},
        headers=headers,
    )

    assert res.status_code == 400
    assert "Question text cannot be empty" in res.json()["detail"]
