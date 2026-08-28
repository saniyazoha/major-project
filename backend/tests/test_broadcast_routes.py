import json
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
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.glossary import Glossary
from app.core import security
from app.services import storage_service


@pytest.fixture
def broadcast_route_setup(monkeypatch):
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

    batch1 = Batch(batchname="2026-A", subject_id=sub1.id)
    session.add(batch1)
    session.commit()

    # Enroll Stu1 into Batch 1
    enr1 = Enrollment(student_id=stu1.id, batch_id=batch1.id)
    session.add(enr1)
    session.commit()

    # Seed Subject 2 & Batch 2 owned by Fac 2
    sub2 = Subject(name="Compiler Design", faculty_id=fac2.id)
    session.add(sub2)
    session.commit()

    batch2 = Batch(batchname="2026-B", subject_id=sub2.id)
    session.add(batch2)
    session.commit()

    # Create tokens (JWT sub claim must be str(user_id))
    fac1_token = security.create_access_token({"sub": str(fac1.id), "role": "faculty"})
    fac2_token = security.create_access_token({"sub": str(fac2.id), "role": "faculty"})
    stu1_token = security.create_access_token({"sub": str(stu1.id), "role": "student"})

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)

    yield {
        "client": client,
        "session": session,
        "fac1": fac1,
        "fac2": fac2,
        "stu1": stu1,
        "batch1": batch1,
        "batch2": batch2,
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
    }

    app.dependency_overrides.clear()


def test_owning_faculty_broadcasts_draft_lecture(broadcast_route_setup):
    """1. Owning faculty broadcasts a draft lecture -> 200 OK and status becomes broadcast."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    fac1_token = broadcast_route_setup["fac1_token"]

    lec = Lecture(
        title="Virtual Memory",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="vm.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/vm.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "broadcast"

    # Verify DB state
    session.refresh(lec)
    assert lec.status == "broadcast"


def test_non_owning_faculty_cannot_broadcast(broadcast_route_setup):
    """2. Non-owning faculty attempts to broadcast -> 403 Forbidden and status unchanged."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    fac2_token = broadcast_route_setup["fac2_token"]

    lec = Lecture(
        title="Page Replacement",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="pr.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/pr.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {fac2_token}"},
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

    session.refresh(lec)
    assert lec.status == "draft"


def test_student_cannot_broadcast(broadcast_route_setup):
    """3. Student attempts to broadcast -> 403 Forbidden and status unchanged."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    stu1_token = broadcast_route_setup["stu1_token"]

    lec = Lecture(
        title="Segmentation",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="seg.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/seg.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {stu1_token}"},
    )
    assert res.status_code == 403

    session.refresh(lec)
    assert lec.status == "draft"


def test_broadcast_rejected_for_uploaded_status(broadcast_route_setup):
    """4. Lecture in 'uploaded' status -> 409 Conflict and status remains 'uploaded'."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    fac1_token = broadcast_route_setup["fac1_token"]

    lec = Lecture(
        title="Disk Scheduling",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="ds.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/ds.mp3",
        status="uploaded",
    )
    session.add(lec)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 409
    assert "cannot be broadcast" in res.json()["detail"]

    session.refresh(lec)
    assert lec.status == "uploaded"


def test_broadcast_rejected_for_generation_failed_status(broadcast_route_setup):
    """5. Lecture in 'generation_failed' status -> 409 Conflict and status remains 'generation_failed'."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    fac1_token = broadcast_route_setup["fac1_token"]

    lec = Lecture(
        title="Concurrency",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="conc.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/conc.mp3",
        status="generation_failed",
        generation_error_message="LLM API timeout",
    )
    session.add(lec)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 409
    assert "cannot be broadcast" in res.json()["detail"]

    session.refresh(lec)
    assert lec.status == "generation_failed"
    assert lec.generation_error_message == "LLM API timeout"


def test_broadcast_rejected_for_already_broadcast_lecture(broadcast_route_setup):
    """6. Lecture already 'broadcast' -> 409 Conflict on repeated call and status remains 'broadcast'."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    fac1_token = broadcast_route_setup["fac1_token"]

    lec = Lecture(
        title="Deadlocks",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="deadlock.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/deadlock.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 409
    assert "cannot be broadcast" in res.json()["detail"]

    session.refresh(lec)
    assert lec.status == "broadcast"


def test_broadcast_missing_lecture_returns_404(broadcast_route_setup):
    """7. Missing lecture -> 404 Not Found."""
    client = broadcast_route_setup["client"]
    fac1_token = broadcast_route_setup["fac1_token"]

    res = client.post(
        "/lectures/99999/broadcast",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Lecture not found"


def test_successful_broadcast_does_not_mutate_existing_data(broadcast_route_setup):
    """8. Successful broadcast transitions draft -> broadcast and does not mutate any transcript or generated content records."""
    session = broadcast_route_setup["session"]
    client = broadcast_route_setup["client"]
    fac1 = broadcast_route_setup["fac1"]
    batch1 = broadcast_route_setup["batch1"]
    fac1_token = broadcast_route_setup["fac1_token"]

    # 1. Seed Lecture in 'draft' status
    lec = Lecture(
        title="Synchronization Primitives",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="sync.mp3",
        file_type="audio/mpeg",
        file_size=2000,
        storage_path="lectures/sync.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    # 2. Seed associated Transcript
    tr = Transcript(
        lecture_id=lec.id,
        status="completed",
        raw_text="Raw transcript for sync primitives.",
        corrected_text="Corrected transcript for synchronization primitives.",
    )
    session.add(tr)

    # 3. Seed Note
    note = Note(
        lecture_id=lec.id,
        markdown_content="# Synchronization\nMutexes and Semaphores.",
        summary_text="Overview of mutexes and semaphores.",
    )
    session.add(note)

    # 4. Seed Flashcards
    fc1 = Flashcard(lecture_id=lec.id, question="What is a mutex?", answer="A mutual exclusion lock.")
    fc2 = Flashcard(lecture_id=lec.id, question="What is a semaphore?", answer="A signaling mechanism.")
    session.add_all([fc1, fc2])

    # 5. Seed Quiz
    quiz1 = Quiz(
        lecture_id=lec.id,
        question="Which primitive prevents race conditions?",
        options_json=json.dumps(["Mutex", "Buffer", "Thread", "Process"]),
        correct_answer="Mutex",
        explanation="Mutex guarantees single-thread access.",
    )
    session.add(quiz1)

    # 6. Seed Glossary
    g1 = Glossary(lecture_id=lec.id, term="Mutex", definition="Mutual exclusion lock")
    session.add(g1)

    session.commit()

    # Record all content values before calling broadcast
    orig_tr_raw = tr.raw_text
    orig_tr_corr = tr.corrected_text
    orig_tr_status = tr.status
    orig_note_md = note.markdown_content
    orig_note_summary = note.summary_text
    orig_fc1_q = fc1.question
    orig_fc1_a = fc1.answer
    orig_fc2_q = fc2.question
    orig_fc2_a = fc2.answer
    orig_quiz_q = quiz1.question
    orig_quiz_opt = quiz1.options_json
    orig_quiz_ans = quiz1.correct_answer
    orig_quiz_exp = quiz1.explanation
    orig_glossary_term = g1.term
    orig_glossary_def = g1.definition

    # Call broadcast endpoint
    res = client.post(
        f"/lectures/{lec.id}/broadcast",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "broadcast"

    # Refresh objects from DB
    session.refresh(lec)
    session.refresh(tr)
    session.refresh(note)
    session.refresh(fc1)
    session.refresh(fc2)
    session.refresh(quiz1)
    session.refresh(g1)

    # Verify only lecture.status changed to 'broadcast'
    assert lec.status == "broadcast"

    # Verify transcript fields are untouched
    assert tr.raw_text == orig_tr_raw
    assert tr.corrected_text == orig_tr_corr
    assert tr.status == orig_tr_status

    # Verify Note fields are untouched
    assert note.markdown_content == orig_note_md
    assert note.summary_text == orig_note_summary

    # Verify Flashcard fields are untouched
    assert fc1.question == orig_fc1_q
    assert fc1.answer == orig_fc1_a
    assert fc2.question == orig_fc2_q
    assert fc2.answer == orig_fc2_a

    # Verify Quiz fields are untouched
    assert quiz1.question == orig_quiz_q
    assert quiz1.options_json == orig_quiz_opt
    assert quiz1.correct_answer == orig_quiz_ans
    assert quiz1.explanation == orig_quiz_exp

    # Verify Glossary fields are untouched
    assert g1.term == orig_glossary_term
    assert g1.definition == orig_glossary_def
