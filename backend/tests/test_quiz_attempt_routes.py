import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.lecture import Lecture
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.core import security


@pytest.fixture
def quiz_attempt_setup():
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
        password_hash=security.hash_password("Pass123!"),
    )
    fac2 = Faculty(
        name="Dr. Grace Hopper",
        username="hopper",
        password_hash=security.hash_password("Pass123!"),
    )

    # Seed Student 1 (Ada) & Student 2 (Charles)
    stu1 = Student(
        name="Ada Lovelace",
        rollno="CS101",
        username="ada",
        password_hash=security.hash_password("Pass123!"),
    )
    stu2 = Student(
        name="Charles Babbage",
        rollno="CS102",
        username="charles",
        password_hash=security.hash_password("Pass123!"),
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

    # Enroll Stu1 into Batch 1 (Stu2 is NOT enrolled in Batch 1)
    enr1 = Enrollment(student_id=stu1.id, batch_id=batch1.id)
    session.add(enr1)
    session.commit()

    # Create tokens
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
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
    }

    app.dependency_overrides.clear()


def test_attempt_correct_answer_stores_score_1(quiz_attempt_setup):
    """1. Correct answer: server stores score=1."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec = Lecture(
        title="Processes",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="proc.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/proc.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    quiz = Quiz(
        lecture_id=lec.id,
        question="What is a PCB?",
        options_json=json.dumps(["Process Control Block", "Program Counter Block"]),
        correct_answer="Process Control Block",
        explanation="PCB stands for Process Control Block.",
    )
    session.add(quiz)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/quizzes/{quiz.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "Process Control Block"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["score"] == 1
    assert data["selected_answer"] == "Process Control Block"
    assert data["quiz_id"] == quiz.id


def test_attempt_incorrect_answer_stores_score_0(quiz_attempt_setup):
    """2. Incorrect answer: server stores score=0."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec = Lecture(
        title="Threads",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="thr.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/thr.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    quiz = Quiz(
        lecture_id=lec.id,
        question="What do user-level threads share?",
        options_json=json.dumps(["Address Space", "Registers"]),
        correct_answer="Address Space",
        explanation="Threads share process address space.",
    )
    session.add(quiz)
    session.commit()

    res = client.post(
        f"/lectures/{lec.id}/quizzes/{quiz.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "Registers"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["score"] == 0
    assert data["selected_answer"] == "Registers"


def test_client_cannot_control_score(quiz_attempt_setup):
    """3. Client cannot control score: server still computes correct score regardless of client payload."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec = Lecture(
        title="Scheduling",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="sched.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/sched.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    quiz = Quiz(
        lecture_id=lec.id,
        question="Which algorithm is non-preemptive?",
        options_json=json.dumps(["FCFS", "SRTF"]),
        correct_answer="FCFS",
        explanation="FCFS runs to completion.",
    )
    session.add(quiz)
    session.commit()

    # Pass incorrect answer but attempt to inject score=1 in body
    res = client.post(
        f"/lectures/{lec.id}/quizzes/{quiz.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "SRTF", "score": 1},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["score"] == 0  # Server correctly computes 0


def test_duplicate_attempt_returns_409(quiz_attempt_setup):
    """4. Duplicate attempt: second POST for same student + quiz returns 409 and only 1 row exists."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1 = quiz_attempt_setup["stu1"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec = Lecture(
        title="Semaphores",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="sem.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/sem.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    quiz = Quiz(
        lecture_id=lec.id,
        question="What operation decrements a semaphore?",
        options_json=json.dumps(["wait", "signal"]),
        correct_answer="wait",
        explanation="wait decrements value.",
    )
    session.add(quiz)
    session.commit()

    # First attempt -> 201
    res1 = client.post(
        f"/lectures/{lec.id}/quizzes/{quiz.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "wait"},
    )
    assert res1.status_code == 201

    # Second attempt -> 409
    res2 = client.post(
        f"/lectures/{lec.id}/quizzes/{quiz.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "signal"},
    )
    assert res2.status_code == 409

    # Verify only 1 attempt in DB
    count = session.query(QuizAttempt).filter(
        QuizAttempt.student_id == stu1.id,
        QuizAttempt.quiz_id == quiz.id,
    ).count()
    assert count == 1


def test_student_cannot_submit_unauthorized_or_draft_lecture(quiz_attempt_setup):
    """5. Student cannot submit for non-broadcast lecture or unenrolled lecture."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1_token = quiz_attempt_setup["stu1_token"]
    stu2_token = quiz_attempt_setup["stu2_token"]  # Not enrolled in batch1

    # Draft lecture
    draft_lec = Lecture(
        title="Draft Memory",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="dm.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/dm.mp3",
        status="draft",
    )
    # Broadcast lecture
    bcast_lec = Lecture(
        title="Broadcast Memory",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="bm.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/bm.mp3",
        status="broadcast",
    )
    session.add_all([draft_lec, bcast_lec])
    session.commit()

    q_draft = Quiz(
        lecture_id=draft_lec.id,
        question="Draft Q?",
        options_json=json.dumps(["A", "B"]),
        correct_answer="A",
    )
    q_bcast = Quiz(
        lecture_id=bcast_lec.id,
        question="Broadcast Q?",
        options_json=json.dumps(["A", "B"]),
        correct_answer="A",
    )
    session.add_all([q_draft, q_bcast])
    session.commit()

    # Enrolled student attempting draft lecture -> 403
    res1 = client.post(
        f"/lectures/{draft_lec.id}/quizzes/{q_draft.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "A"},
    )
    assert res1.status_code == 403

    # Unenrolled student attempting broadcast lecture -> 403
    res2 = client.post(
        f"/lectures/{bcast_lec.id}/quizzes/{q_bcast.id}/attempt",
        headers={"Authorization": f"Bearer {stu2_token}"},
        json={"selected_answer": "A"},
    )
    assert res2.status_code == 403


def test_quiz_lecture_relationship_mismatch(quiz_attempt_setup):
    """6. Quiz/lecture relationship: cannot submit a quiz under a different lecture_id."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec1 = Lecture(
        title="Lec 1",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="l1.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/l1.mp3",
        status="broadcast",
    )
    lec2 = Lecture(
        title="Lec 2",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="l2.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/l2.mp3",
        status="broadcast",
    )
    session.add_all([lec1, lec2])
    session.commit()

    q_lec1 = Quiz(
        lecture_id=lec1.id,
        question="Quiz for Lec 1",
        options_json=json.dumps(["A", "B"]),
        correct_answer="A",
    )
    session.add(q_lec1)
    session.commit()

    # Submit quiz under lec2.id -> 404
    res = client.post(
        f"/lectures/{lec2.id}/quizzes/{q_lec1.id}/attempt",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"selected_answer": "A"},
    )
    assert res.status_code == 404
    assert "Quiz not found" in res.json()["detail"]


def test_student_isolation_attempts_retrieval(quiz_attempt_setup):
    """7. Student isolation: student cannot retrieve another student's attempts."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1 = quiz_attempt_setup["stu1"]
    stu2 = quiz_attempt_setup["stu2"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec = Lecture(
        title="Isolation Test",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="iso.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/iso.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    quiz = Quiz(
        lecture_id=lec.id,
        question="Iso Q?",
        options_json=json.dumps(["A", "B"]),
        correct_answer="A",
    )
    session.add(quiz)
    session.commit()

    # Add attempt for stu2 directly
    att2 = QuizAttempt(student_id=stu2.id, quiz_id=quiz.id, score=1, selected_answer="A")
    session.add(att2)
    session.commit()

    # Stu1 retrieves attempts -> receives empty list (does not leak stu2's attempt)
    res = client.get(
        f"/lectures/{lec.id}/quizzes/attempts",
        headers={"Authorization": f"Bearer {stu1_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 0


def test_faculty_authorization_quiz_performance(quiz_attempt_setup):
    """8. Faculty authorization: owning faculty can retrieve performance, non-owning and student receive 403."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    fac1_token = quiz_attempt_setup["fac1_token"]
    fac2_token = quiz_attempt_setup["fac2_token"]
    stu1_token = quiz_attempt_setup["stu1_token"]

    lec = Lecture(
        title="Auth Test Lec",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="auth.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/auth.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    # Owning faculty -> 200
    res1 = client.get(
        f"/lectures/{lec.id}/quiz-performance",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res1.status_code == 200

    # Non-owning faculty -> 403
    res2 = client.get(
        f"/lectures/{lec.id}/quiz-performance",
        headers={"Authorization": f"Bearer {fac2_token}"},
    )
    assert res2.status_code == 403

    # Student -> 403
    res3 = client.get(
        f"/lectures/{lec.id}/quiz-performance",
        headers={"Authorization": f"Bearer {stu1_token}"},
    )
    assert res3.status_code == 403


def test_empty_lecture_quiz_performance(quiz_attempt_setup):
    """9. Empty lecture: no attempts returns valid zero/empty aggregate."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    fac1_token = quiz_attempt_setup["fac1_token"]

    lec = Lecture(
        title="Empty Lec",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="empty.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/empty.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    q1 = Quiz(
        lecture_id=lec.id,
        question="Empty Q1",
        options_json=json.dumps(["A", "B"]),
        correct_answer="A",
    )
    session.add(q1)
    session.commit()

    res = client.get(
        f"/lectures/{lec.id}/quiz-performance",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["lecture_id"] == lec.id
    assert data["average_score"] == 0.0
    assert data["students_attempted"] == 0
    assert data["student_results"] == []
    assert data["most_missed_questions"] == []


def test_aggregation_correctness(quiz_attempt_setup):
    """10. Aggregation correctness: distinct student count, student scores, average score, and most-missed questions."""
    session = quiz_attempt_setup["session"]
    client = quiz_attempt_setup["client"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1 = quiz_attempt_setup["stu1"]
    stu2 = quiz_attempt_setup["stu2"]
    fac1_token = quiz_attempt_setup["fac1_token"]

    lec = Lecture(
        title="Agg Lec",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="agg.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/agg.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    q1 = Quiz(lecture_id=lec.id, question="Easy Q", options_json='["A", "B"]', correct_answer="A")
    q2 = Quiz(lecture_id=lec.id, question="Hard Q", options_json='["A", "B"]', correct_answer="A")
    session.add_all([q1, q2])
    session.commit()

    # Stu1: q1 correct (1), q2 correct (1) -> 2/2 = 100%
    # Stu2: q1 correct (1), q2 incorrect (0) -> 1/2 = 50%
    att1 = QuizAttempt(student_id=stu1.id, quiz_id=q1.id, score=1, selected_answer="A")
    att2 = QuizAttempt(student_id=stu1.id, quiz_id=q2.id, score=1, selected_answer="A")
    att3 = QuizAttempt(student_id=stu2.id, quiz_id=q1.id, score=1, selected_answer="A")
    att4 = QuizAttempt(student_id=stu2.id, quiz_id=q2.id, score=0, selected_answer="B")
    session.add_all([att1, att2, att3, att4])
    session.commit()

    res = client.get(
        f"/lectures/{lec.id}/quiz-performance",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["students_attempted"] == 2
    assert data["average_score"] == 75.0  # (100% + 50%) / 2 = 75%
    assert len(data["student_results"]) == 2

    stu1_res = next(s for s in data["student_results"] if s["student_id"] == stu1.id)
    assert stu1_res["correct_count"] == 2
    assert stu1_res["total_questions"] == 2
    assert stu1_res["score_percentage"] == 100.0

    stu2_res = next(s for s in data["student_results"] if s["student_id"] == stu2.id)
    assert stu2_res["correct_count"] == 1
    assert stu2_res["total_questions"] == 2
    assert stu2_res["score_percentage"] == 50.0

    assert len(data["most_missed_questions"]) == 1
    assert data["most_missed_questions"][0]["quiz_id"] == q2.id
    assert data["most_missed_questions"][0]["question"] == "Hard Q"
    assert data["most_missed_questions"][0]["incorrect_count"] == 1
    assert data["most_missed_questions"][0]["total_attempts"] == 2



def test_cascade_delete_quiz_deletes_attempts(quiz_attempt_setup):
    """11. Cascade: deleting a Quiz row cascades to its quiz_attempts rows."""
    session = quiz_attempt_setup["session"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1 = quiz_attempt_setup["stu1"]

    lec = Lecture(
        title="Cascade Lec",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="cas.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/cas.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    q = Quiz(lecture_id=lec.id, question="Cas Q", options_json='["A", "B"]', correct_answer="A")
    session.add(q)
    session.commit()

    att = QuizAttempt(student_id=stu1.id, quiz_id=q.id, score=1, selected_answer="A")
    session.add(att)
    session.commit()

    # Delete Quiz
    session.delete(q)
    session.commit()

    # Verify QuizAttempt is deleted
    assert session.query(QuizAttempt).filter(QuizAttempt.quiz_id == q.id).count() == 0


def test_database_uniqueness(quiz_attempt_setup):
    """12. Database uniqueness: duplicate (student_id, quiz_id) cannot create two rows."""
    session = quiz_attempt_setup["session"]
    fac1 = quiz_attempt_setup["fac1"]
    batch1 = quiz_attempt_setup["batch1"]
    stu1 = quiz_attempt_setup["stu1"]

    lec = Lecture(
        title="DB Unique Lec",
        subject_id=batch1.subject_id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="dbu.mp3",
        file_type="audio/mpeg",
        file_size=1000,
        storage_path="lectures/dbu.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    q = Quiz(lecture_id=lec.id, question="DB Q", options_json='["A", "B"]', correct_answer="A")
    session.add(q)
    session.commit()

    att1 = QuizAttempt(student_id=stu1.id, quiz_id=q.id, score=1, selected_answer="A")
    session.add(att1)
    session.commit()

    att2 = QuizAttempt(student_id=stu1.id, quiz_id=q.id, score=0, selected_answer="B")
    session.add(att2)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()
