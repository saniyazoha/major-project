import pytest
from datetime import date, timedelta
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
from app.models.flashcard import Flashcard
from app.models.flashcard_progress import FlashcardProgress
from app.core import security
from app.services.flashcard_service import calculate_sm2


def test_sm2_algorithm_mathematical_correctness():
    """Verify exact SM-2 mathematical outputs across quality scores and initial states."""
    # First review with default initial values (EF=2.5, I=0)
    # Quality 5 (Perfect): EF' = 2.5 + (0.1 - 0) = 2.6, I' = 1
    ef, interval = calculate_sm2(5, old_ef=2.5, old_interval=0)
    assert ef == 2.6
    assert interval == 1

    # Quality 4 (Good): EF' = 2.5 + (0.1 - 1*(0.08 + 0.02)) = 2.5, I' = 1
    ef, interval = calculate_sm2(4, old_ef=2.5, old_interval=0)
    assert ef == 2.5
    assert interval == 1

    # Quality 3 (Hard): EF' = 2.5 + (0.1 - 2*(0.08 + 0.04)) = 2.5 - 0.14 = 2.36, I' = 1
    ef, interval = calculate_sm2(3, old_ef=2.5, old_interval=0)
    assert ef == 2.36
    assert interval == 1

    # Second review (EF=2.5, I=1), Quality 4 -> I' = 6
    ef, interval = calculate_sm2(4, old_ef=2.5, old_interval=1)
    assert ef == 2.5
    assert interval == 6

    # Third review (EF=2.5, I=6), Quality 4 -> I' = round(6 * 2.5) = 15
    ef, interval = calculate_sm2(4, old_ef=2.5, old_interval=6)
    assert ef == 2.5
    assert interval == 15

    # Failure review (quality < 3) -> interval resets to 0 days
    ef, interval = calculate_sm2(1, old_ef=2.5, old_interval=15)
    assert interval == 0
    assert ef < 2.5

    # Minimum Ease Factor Cap (1.3)
    ef, interval = calculate_sm2(0, old_ef=1.4, old_interval=5)
    assert ef == 1.3
    assert interval == 0


@pytest.fixture
def sr_setup():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    fac = Faculty(name="Dr. Turing", username="turing", password_hash=security.hash_password("Pass123!"))
    stu1 = Student(name="Student One", rollno="S01", username="stu1", password_hash=security.hash_password("Pass123!"))
    stu2 = Student(name="Student Two", rollno="S02", username="stu2", password_hash=security.hash_password("Pass123!"))
    session.add_all([fac, stu1, stu2])
    session.commit()

    sub = Subject(name="Data Structures", faculty_id=fac.id)
    session.add(sub)
    session.commit()

    batch = Batch(batchname="CS-2026", subject_id=sub.id)
    session.add(batch)
    session.commit()

    enr1 = Enrollment(student_id=stu1.id, batch_id=batch.id)
    session.add(enr1)
    session.commit()

    lec = Lecture(
        title="Binary Trees",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="trees.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/trees.mp4",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    fc1 = Flashcard(lecture_id=lec.id, question="What is a tree?", answer="A non-linear data structure.")
    fc2 = Flashcard(lecture_id=lec.id, question="What is a binary tree?", answer="Tree with at most 2 children.")
    fc3 = Flashcard(lecture_id=lec.id, question="What is AVL tree?", answer="Self-balancing BST.")
    session.add_all([fc1, fc2, fc3])
    session.commit()

    fac_token = security.create_access_token({"sub": str(fac.id), "role": "faculty"})
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
        "fac": fac,
        "stu1": stu1,
        "stu2": stu2,
        "lec": lec,
        "fc1": fc1,
        "fc2": fc2,
        "fc3": fc3,
        "fac_token": fac_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
    }

    app.dependency_overrides.clear()


def test_get_flashcards_review_authorization_and_enrollment_gate(sr_setup):
    """GET /lectures/{id}/flashcards/review requires student role and enrolled broadcast access."""
    client = sr_setup["client"]
    lec = sr_setup["lec"]

    # 1. Unauthenticated -> 401
    res = client.get(f"/lectures/{lec.id}/flashcards/review")
    assert res.status_code == 401

    # 2. Faculty access -> 403 Forbidden
    res_fac = client.get(
        f"/lectures/{lec.id}/flashcards/review",
        headers={"Authorization": f"Bearer {sr_setup['fac_token']}"},
    )
    assert res_fac.status_code == 403

    # 3. Not enrolled student -> 403 Forbidden
    res_stu2 = client.get(
        f"/lectures/{lec.id}/flashcards/review",
        headers={"Authorization": f"Bearer {sr_setup['stu2_token']}"},
    )
    assert res_stu2.status_code == 403

    # 4. Enrolled student -> 200 OK
    res_stu1 = client.get(
        f"/lectures/{lec.id}/flashcards/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
    )
    assert res_stu1.status_code == 200
    assert len(res_stu1.json()) == 3


def test_get_flashcards_review_ordering_due_new_undue(sr_setup):
    """Due cards appear first, new cards next, undue cards last."""
    client = sr_setup["client"]
    session = sr_setup["session"]
    stu1 = sr_setup["stu1"]
    lec = sr_setup["lec"]
    fc1 = sr_setup["fc1"]
    fc2 = sr_setup["fc2"]
    fc3 = sr_setup["fc3"]

    today = date.today()
    # fc1: due today (or past)
    p1 = FlashcardProgress(
        student_id=stu1.id,
        flashcard_id=fc1.id,
        ease_factor=2.5,
        interval_days=1,
        next_review_date=today - timedelta(days=1),
    )
    # fc2: undue (next review in 5 days)
    p2 = FlashcardProgress(
        student_id=stu1.id,
        flashcard_id=fc2.id,
        ease_factor=2.5,
        interval_days=5,
        next_review_date=today + timedelta(days=5),
    )
    # fc3: new card (no progress record)
    session.add_all([p1, p2])
    session.commit()

    res = client.get(
        f"/lectures/{lec.id}/flashcards/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 3

    # Expected order: due card (fc1), new card (fc3), undue card (fc2)
    assert data[0]["id"] == fc1.id
    assert data[1]["id"] == fc3.id
    assert data[2]["id"] == fc2.id


def test_post_flashcard_review_first_and_repeat_review(sr_setup):
    """POST /flashcards/{id}/review handles first review creation, validation, repeat review, and student isolation."""
    client = sr_setup["client"]
    session = sr_setup["session"]
    stu1 = sr_setup["stu1"]
    stu2 = sr_setup["stu2"]
    fc1 = sr_setup["fc1"]

    # 1. Invalid quality score (e.g. 6 or -1) -> 422
    res_inv = client.post(
        f"/flashcards/{fc1.id}/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
        json={"quality": 6},
    )
    assert res_inv.status_code == 422

    # 2. First review submission for stu1 (Quality 5)
    res1 = client.post(
        f"/flashcards/{fc1.id}/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
        json={"quality": 5},
    )
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["student_id"] == stu1.id
    assert d1["flashcard_id"] == fc1.id
    assert d1["ease_factor"] == 2.6
    assert d1["interval_days"] == 1
    assert d1["next_review_date"] == str(date.today() + timedelta(days=1))

    # 3. Repeat review submission for stu1 (Quality 4) -> interval increases to 6
    res2 = client.post(
        f"/flashcards/{fc1.id}/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
        json={"quality": 4},
    )
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["ease_factor"] == 2.6
    assert d2["interval_days"] == 6
    assert d2["next_review_date"] == str(date.today() + timedelta(days=6))

    # 4. Student Isolation: verify stu2 has no progress created by stu1's review
    p2 = (
        session.query(FlashcardProgress)
        .filter(
            FlashcardProgress.student_id == stu2.id,
            FlashcardProgress.flashcard_id == fc1.id,
        )
        .first()
    )
    assert p2 is None


def test_post_flashcard_review_nonexistent_and_unauthorized(sr_setup):
    """POST /flashcards/{id}/review returns 404 for nonexistent card and 403 for unauthorized student."""
    client = sr_setup["client"]
    fc1 = sr_setup["fc1"]

    # Non-existent flashcard -> 404
    res_404 = client.post(
        "/flashcards/99999/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
        json={"quality": 4},
    )
    assert res_404.status_code == 404

    # Unenrolled student (stu2) -> 403
    res_403 = client.post(
        f"/flashcards/{fc1.id}/review",
        headers={"Authorization": f"Bearer {sr_setup['stu2_token']}"},
        json={"quality": 4},
    )
    assert res_403.status_code == 403


def test_post_flashcard_review_again_scheduling(sr_setup):
    """First review with quality=1 ('Again') sets interval=0, next_review_date=today, and makes card due same day."""
    client = sr_setup["client"]
    lec = sr_setup["lec"]
    fc1 = sr_setup["fc1"]
    fc2 = sr_setup["fc2"]

    today = date.today()

    # 1. First review with quality=1 ("Again")
    res1 = client.post(
        f"/flashcards/{fc1.id}/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
        json={"quality": 1},
    )
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["interval_days"] == 0
    assert d1["next_review_date"] == str(today)

    # 2. First review with quality=4 ("Good")
    res2 = client.post(
        f"/flashcards/{fc2.id}/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
        json={"quality": 4},
    )
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["interval_days"] == 1
    assert d2["next_review_date"] == str(today + timedelta(days=1))

    # 3. Subsequent review request made the same day: fc1 ("Again") must be returned in due cards
    res_rev = client.get(
        f"/lectures/{lec.id}/flashcards/review",
        headers={"Authorization": f"Bearer {sr_setup['stu1_token']}"},
    )
    assert res_rev.status_code == 200
    cards = res_rev.json()
    
    # fc1 is due today (interval=0, next_review_date=today), fc2 is undue (next_review_date=tomorrow), fc3 is new
    # Order: due cards (fc1), new cards (fc3), undue cards (fc2)
    assert cards[0]["id"] == fc1.id
    assert cards[1]["id"] == sr_setup["fc3"].id
    assert cards[2]["id"] == fc2.id
