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
def study_hub_setup(monkeypatch):
    monkeypatch.setattr(storage_service, "upload_lecture_file", lambda **kw: "lectures/mock.mp3")

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed Faculty 1 (Turing) & Faculty 2 (Hopper)
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
    # Seed Student 1 (Enrolled in Batch 1) & Student 2 (Not enrolled)
    stu1 = Student(
        name="Ada Lovelace",
        rollno="CS101",
        username="ada",
        password_hash=security.hash_password("Pass123!")
    )
    stu2 = Student(
        name="Charles Babbage",
        rollno="CS102",
        username="charles",
        password_hash=security.hash_password("Pass123!")
    )
    session.add_all([fac1, fac2, stu1, stu2])
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
    stu2_token = security.create_access_token({"sub": str(stu2.id), "role": "student"})

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
        "stu2": stu2,
        "batch1": batch1,
        "batch2": batch2,
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
    }

    app.dependency_overrides.clear()


def seed_lecture_with_all_content(session, batch, fac_id, status_val="broadcast"):
    """Helper to seed a lecture with Note, Flashcards, Quizzes, Glossary, and Transcript."""
    lec = Lecture(
        title="Virtual Memory Management",
        subject_id=batch.subject_id,
        batch_id=batch.id,
        faculty_id=fac_id,
        original_filename="vm.mp3",
        file_type="audio/mpeg",
        file_size=1500,
        storage_path="lectures/vm.mp3",
        status=status_val,
    )
    session.add(lec)
    session.commit()

    tr = Transcript(
        lecture_id=lec.id,
        status="completed",
        raw_text="Raw text for Virtual Memory",
        corrected_text="Corrected text for Virtual Memory",
    )
    session.add(tr)

    note = Note(
        lecture_id=lec.id,
        markdown_content="# Virtual Memory Notes",
        summary_text="Summary of virtual memory.",
    )
    session.add(note)

    fc1 = Flashcard(lecture_id=lec.id, question="What is paging?", answer="A memory management scheme.")
    fc2 = Flashcard(lecture_id=lec.id, question="What is TLB?", answer="Translation Lookaside Buffer.")
    session.add_all([fc1, fc2])

    quiz1 = Quiz(
        lecture_id=lec.id,
        question="What handles page faults?",
        options_json=json.dumps(["OS Kernel", "CPU ALU", "RAM", "Disk"]),
        correct_answer="OS Kernel",
        explanation="The OS kernel handles page fault interrupts.",
    )
    session.add(quiz1)

    gloss1 = Glossary(lecture_id=lec.id, term="Page Fault", definition="Interrupt when page is not in RAM.")
    session.add(gloss1)

    session.commit()
    return lec


# ============================================================================
# 1. NOTES ENDPOINT TESTS (GET /lectures/{id}/notes)
# ============================================================================

def test_get_notes_owning_faculty_success(study_hub_setup):
    """Owning faculty can read notes (broadcast status)."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["lecture_id"] == lec.id
    assert data["markdown_content"] == "# Virtual Memory Notes"
    assert data["summary_text"] == "Summary of virtual memory."


def test_get_notes_faculty_preview_draft_success(study_hub_setup):
    """Owning faculty can preview notes when lecture status is 'draft'."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="draft")

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["markdown_content"] == "# Virtual Memory Notes"


def test_get_notes_non_owning_faculty_forbidden(study_hub_setup):
    """Non-owning faculty receives 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    fac2_token = study_hub_setup["fac2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Access denied for this lecture"


def test_get_notes_enrolled_student_broadcast_success(study_hub_setup):
    """Enrolled student can read notes for broadcast lecture."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 200
    assert res.json()["markdown_content"] == "# Virtual Memory Notes"


@pytest.mark.parametrize("non_broadcast_status", ["uploaded", "generation_failed", "draft"])
def test_get_notes_enrolled_student_non_broadcast_forbidden(study_hub_setup, non_broadcast_status):
    """SECURITY TEST: Enrolled student directly requesting non-broadcast lecture gets 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val=non_broadcast_status)

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Access denied for this lecture"


def test_get_notes_non_enrolled_student_forbidden(study_hub_setup):
    """Non-enrolled student gets 403 Forbidden even if lecture is broadcast."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu2_token = study_hub_setup["stu2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Access denied for this lecture"


def test_get_notes_missing_lecture_returns_404(study_hub_setup):
    """Missing lecture ID returns 404 Not Found."""
    client = study_hub_setup["client"]
    token = study_hub_setup["fac1_token"]

    res = client.get("/lectures/99999/notes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert res.json()["detail"] == "Lecture not found"


def test_get_notes_missing_note_row_returns_404(study_hub_setup):
    """Authorized lecture with no Note row in DB returns 404 Not Found."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = Lecture(
        title="Lecture Without Notes",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="no_notes.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/no_notes.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    res = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert res.json()["detail"] == "Note content not found for this lecture"


# ============================================================================
# 2. FLASHCARDS ENDPOINT TESTS (GET /lectures/{id}/flashcards)
# ============================================================================

def test_get_flashcards_owning_faculty_success(study_hub_setup):
    """Owning faculty can read flashcards."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["question"] == "What is paging?"


def test_get_flashcards_non_owning_faculty_forbidden(study_hub_setup):
    """Non-owning faculty receives 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    fac2_token = study_hub_setup["fac2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res.status_code == 403


def test_get_flashcards_enrolled_student_broadcast_success(study_hub_setup):
    """Enrolled student can read flashcards for broadcast lecture."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.parametrize("non_broadcast_status", ["uploaded", "generation_failed", "draft"])
def test_get_flashcards_enrolled_student_non_broadcast_forbidden(study_hub_setup, non_broadcast_status):
    """SECURITY TEST: Enrolled student directly requesting non-broadcast flashcards gets 403."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val=non_broadcast_status)

    res = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 403


def test_get_flashcards_non_enrolled_student_forbidden(study_hub_setup):
    """Non-enrolled student gets 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu2_token = study_hub_setup["stu2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res.status_code == 403


def test_get_flashcards_missing_lecture_returns_404(study_hub_setup):
    """Missing lecture ID returns 404."""
    client = study_hub_setup["client"]
    token = study_hub_setup["fac1_token"]

    res = client.get("/lectures/99999/flashcards", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404


def test_get_flashcards_empty_rows_returns_200_empty_list(study_hub_setup):
    """Authorized lecture with no Flashcard rows returns 200 OK with empty list []."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = Lecture(
        title="Lecture Without Flashcards",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="no_fc.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/no_fc.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    res = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == []


# ============================================================================
# 3. QUIZZES ENDPOINT TESTS (GET /lectures/{id}/quizzes)
# ============================================================================

def test_get_quizzes_owning_faculty_success(study_hub_setup):
    """Owning faculty can read quizzes including options, correct_answer, and explanation."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["question"] == "What handles page faults?"
    assert data[0]["correct_answer"] == "OS Kernel"
    assert data[0]["explanation"] == "The OS kernel handles page fault interrupts."


def test_get_quizzes_non_owning_faculty_forbidden(study_hub_setup):
    """Non-owning faculty receives 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    fac2_token = study_hub_setup["fac2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res.status_code == 403


def test_get_quizzes_enrolled_student_broadcast_success(study_hub_setup):
    """Enrolled student can read quizzes for broadcast lecture."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 200
    assert len(res.json()) == 1


@pytest.mark.parametrize("non_broadcast_status", ["uploaded", "generation_failed", "draft"])
def test_get_quizzes_enrolled_student_non_broadcast_forbidden(study_hub_setup, non_broadcast_status):
    """SECURITY TEST: Enrolled student directly requesting non-broadcast quizzes gets 403."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val=non_broadcast_status)

    res = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 403


def test_get_quizzes_non_enrolled_student_forbidden(study_hub_setup):
    """Non-enrolled student gets 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu2_token = study_hub_setup["stu2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res.status_code == 403


def test_get_quizzes_missing_lecture_returns_404(study_hub_setup):
    """Missing lecture ID returns 404."""
    client = study_hub_setup["client"]
    token = study_hub_setup["fac1_token"]

    res = client.get("/lectures/99999/quizzes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404


def test_get_quizzes_empty_rows_returns_200_empty_list(study_hub_setup):
    """Authorized lecture with no Quiz rows returns 200 OK with empty list []."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = Lecture(
        title="Lecture Without Quizzes",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="no_quiz.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/no_quiz.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    res = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == []


# ============================================================================
# 4. GLOSSARY ENDPOINT TESTS (GET /lectures/{id}/glossary)
# ============================================================================

def test_get_glossary_owning_faculty_success(study_hub_setup):
    """Owning faculty can read glossary."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["term"] == "Page Fault"
    assert data[0]["definition"] == "Interrupt when page is not in RAM."


def test_get_glossary_non_owning_faculty_forbidden(study_hub_setup):
    """Non-owning faculty receives 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    fac2_token = study_hub_setup["fac2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res.status_code == 403


def test_get_glossary_enrolled_student_broadcast_success(study_hub_setup):
    """Enrolled student can read glossary for broadcast lecture."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 200
    assert len(res.json()) == 1


@pytest.mark.parametrize("non_broadcast_status", ["uploaded", "generation_failed", "draft"])
def test_get_glossary_enrolled_student_non_broadcast_forbidden(study_hub_setup, non_broadcast_status):
    """SECURITY TEST: Enrolled student directly requesting non-broadcast glossary gets 403."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu1_token = study_hub_setup["stu1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val=non_broadcast_status)

    res = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 403


def test_get_glossary_non_enrolled_student_forbidden(study_hub_setup):
    """Non-enrolled student gets 403 Forbidden."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    stu2_token = study_hub_setup["stu2_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    res = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res.status_code == 403


def test_get_glossary_missing_lecture_returns_404(study_hub_setup):
    """Missing lecture ID returns 404."""
    client = study_hub_setup["client"]
    token = study_hub_setup["fac1_token"]

    res = client.get("/lectures/99999/glossary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404


def test_get_glossary_empty_rows_returns_200_empty_list(study_hub_setup):
    """Authorized lecture with no Glossary rows returns 200 OK with empty list []."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = Lecture(
        title="Lecture Without Glossary",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="no_glos.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/no_glos.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    res = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == []


# ============================================================================
# 5. NON-MUTATION VERIFICATION TESTS
# ============================================================================

def test_unit2_get_endpoints_are_strictly_non_mutating(study_hub_setup):
    """Explicitly verify that GET requests across all 4 endpoints cause zero database state mutations."""
    session = study_hub_setup["session"]
    client = study_hub_setup["client"]
    batch1 = study_hub_setup["batch1"]
    fac1 = study_hub_setup["fac1"]
    token = study_hub_setup["fac1_token"]

    lec = seed_lecture_with_all_content(session, batch1, fac1.id, status_val="broadcast")

    # Capture initial database state
    lec_status_before = lec.status
    tr_before = session.query(Transcript).filter(Transcript.lecture_id == lec.id).first()
    tr_text_before = tr_before.corrected_text
    note_before = session.query(Note).filter(Note.lecture_id == lec.id).first()
    note_content_before = note_before.markdown_content
    fc_count_before = session.query(Flashcard).filter(Flashcard.lecture_id == lec.id).count()
    quiz_count_before = session.query(Quiz).filter(Quiz.lecture_id == lec.id).count()
    gloss_count_before = session.query(Glossary).filter(Glossary.lecture_id == lec.id).count()

    # Perform GET requests on all 4 endpoints
    res_n = client.get(f"/lectures/{lec.id}/notes", headers={"Authorization": f"Bearer {token}"})
    res_f = client.get(f"/lectures/{lec.id}/flashcards", headers={"Authorization": f"Bearer {token}"})
    res_q = client.get(f"/lectures/{lec.id}/quizzes", headers={"Authorization": f"Bearer {token}"})
    res_g = client.get(f"/lectures/{lec.id}/glossary", headers={"Authorization": f"Bearer {token}"})

    assert res_n.status_code == 200
    assert res_f.status_code == 200
    assert res_q.status_code == 200
    assert res_g.status_code == 200

    # Refresh session and assert identical state
    session.refresh(lec)
    session.refresh(tr_before)
    session.refresh(note_before)

    assert lec.status == lec_status_before
    assert tr_before.corrected_text == tr_text_before
    assert note_before.markdown_content == note_content_before
    assert session.query(Flashcard).filter(Flashcard.lecture_id == lec.id).count() == fc_count_before
    assert session.query(Quiz).filter(Quiz.lecture_id == lec.id).count() == quiz_count_before
    assert session.query(Glossary).filter(Glossary.lecture_id == lec.id).count() == gloss_count_before
