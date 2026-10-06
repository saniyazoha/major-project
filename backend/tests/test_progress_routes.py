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
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.core import security


@pytest.fixture
def progress_setup():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed Faculty 1 & Faculty 2
    fac1 = Faculty(name="Dr. Alan Turing", username="turing", password_hash=security.hash_password("Pass123!"))
    fac2 = Faculty(name="Dr. Grace Hopper", username="hopper", password_hash=security.hash_password("Pass123!"))
    session.add_all([fac1, fac2])
    session.commit()

    # Seed Students
    stu1 = Student(name="Ada Lovelace", rollno="CS101", username="ada", password_hash=security.hash_password("Pass123!"))
    stu2 = Student(name="Charles Babbage", rollno="CS102", username="charles", password_hash=security.hash_password("Pass123!"))
    stu3 = Student(name="Margaret Hamilton", rollno="CS103", username="margaret", password_hash=security.hash_password("Pass123!"))
    session.add_all([stu1, stu2, stu3])
    session.commit()

    # Seed Subject 1 owned by Fac 1, Subject 2 owned by Fac 2
    sub1 = Subject(name="Operating Systems", faculty_id=fac1.id)
    sub2 = Subject(name="Compilers", faculty_id=fac2.id)
    session.add_all([sub1, sub2])
    session.commit()

    # Seed Batches
    batch1 = Batch(batchname="2026-A", subject_id=sub1.id)
    batch2 = Batch(batchname="2026-B", subject_id=sub2.id)
    session.add_all([batch1, batch2])
    session.commit()

    # Enrollments:
    # stu1 -> batch1 (fac1)
    # stu2 -> batch1 (fac1) AND batch2 (fac2)
    # stu3 -> batch2 (fac2) ONLY
    enr1 = Enrollment(student_id=stu1.id, batch_id=batch1.id)
    enr2 = Enrollment(student_id=stu2.id, batch_id=batch1.id)
    enr3 = Enrollment(student_id=stu2.id, batch_id=batch2.id)
    enr4 = Enrollment(student_id=stu3.id, batch_id=batch2.id)
    session.add_all([enr1, enr2, enr3, enr4])
    session.commit()

    # Seed Lectures under sub1 (fac1)
    lec1 = Lecture(
        title="Lec 1 OS",
        subject_id=sub1.id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="lec1.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/lec1.mp4",
        status="broadcast",
    )
    lec2 = Lecture(
        title="Lec 2 OS",
        subject_id=sub1.id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="lec2.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/lec2.mp4",
        status="broadcast",
    )
    # Seed Lecture under sub2 (fac2)
    lec3 = Lecture(
        title="Lec 1 Compilers",
        subject_id=sub2.id,
        batch_id=batch2.id,
        faculty_id=fac2.id,
        original_filename="lec3.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/lec3.mp4",
        status="broadcast",
    )
    session.add_all([lec1, lec2, lec3])
    session.commit()

    # Seed Quizzes
    q1_lec1 = Quiz(lecture_id=lec1.id, question="Q1 Lec1", options_json='["A", "B"]', correct_answer="A")
    q2_lec1 = Quiz(lecture_id=lec2.id, question="Q2 Lec1", options_json='["A", "B"]', correct_answer="A")
    q1_lec2 = Quiz(lecture_id=lec2.id, question="Q1 Lec2", options_json='["A", "B"]', correct_answer="A")
    q1_lec3 = Quiz(lecture_id=lec3.id, question="Q1 Lec3", options_json='["A", "B"]', correct_answer="A")
    session.add_all([q1_lec1, q2_lec1, q1_lec2, q1_lec3])
    session.commit()


    # Access Tokens
    fac1_token = security.create_access_token({"sub": str(fac1.id), "role": "faculty"})
    fac2_token = security.create_access_token({"sub": str(fac2.id), "role": "faculty"})
    stu1_token = security.create_access_token({"sub": str(stu1.id), "role": "student"})
    stu2_token = security.create_access_token({"sub": str(stu2.id), "role": "student"})
    stu3_token = security.create_access_token({"sub": str(stu3.id), "role": "student"})

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
        "stu3": stu3,
        "lec1": lec1,
        "lec2": lec2,
        "lec3": lec3,
        "q1_lec1": q1_lec1,
        "q2_lec1": q2_lec1,
        "q1_lec2": q1_lec2,
        "q1_lec3": q1_lec3,
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
        "stu3_token": stu3_token,
    }

    app.dependency_overrides.clear()


def test_student_quiz_stats_zero_attempts(progress_setup):
    """Student with zero attempts receives a valid empty/zero response."""
    client = progress_setup["client"]
    stu1_token = progress_setup["stu1_token"]

    res = client.get("/students/quiz-stats", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == progress_setup["stu1"].id
    assert data["average_score"] is None
    assert data["total_attempts"] == 0


def test_student_quiz_stats_aggregates_across_multiple_lectures(progress_setup):
    """Quiz stats aggregate attempts across multiple lectures for authenticated student only."""
    client = progress_setup["client"]
    session = progress_setup["session"]
    stu1 = progress_setup["stu1"]
    stu2 = progress_setup["stu2"]
    q1_lec1 = progress_setup["q1_lec1"]
    q2_lec1 = progress_setup["q2_lec1"]
    q1_lec2 = progress_setup["q1_lec2"]

    # stu1 attempts across lec1 and lec2 (3 question attempts: 2 correct, 1 incorrect) -> 66.67% across 2 distinct lecture quizzes
    att1 = QuizAttempt(student_id=stu1.id, quiz_id=q1_lec1.id, score=1, selected_answer="A")
    att2 = QuizAttempt(student_id=stu1.id, quiz_id=q2_lec1.id, score=1, selected_answer="A")
    att3 = QuizAttempt(student_id=stu1.id, quiz_id=q1_lec2.id, score=0, selected_answer="B")

    # stu2 attempts 1 quiz (score = 1) -> 100%
    att4 = QuizAttempt(student_id=stu2.id, quiz_id=q1_lec1.id, score=1, selected_answer="A")
    session.add_all([att1, att2, att3, att4])
    session.commit()

    # Fetch stu1 stats (3 questions in 2 lectures -> total_attempts: 2 distinct quizzes)
    res1 = client.get("/students/quiz-stats", headers={"Authorization": f"Bearer {progress_setup['stu1_token']}"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["student_id"] == stu1.id
    assert data1["total_attempts"] == 2
    assert data1["average_score"] == 66.67

    # Fetch stu2 stats
    res2 = client.get("/students/quiz-stats", headers={"Authorization": f"Bearer {progress_setup['stu2_token']}"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["student_id"] == stu2.id
    assert data2["total_attempts"] == 1
    assert data2["average_score"] == 100.0


def test_distinct_lecture_quizzes_count_and_scoring_accuracy(progress_setup):
    """Verify that multiple question attempts in ONE lecture quiz count as 1 quiz attempt, and 2 lectures count as 2."""
    client = progress_setup["client"]
    session = progress_setup["session"]
    stu1 = progress_setup["stu1"]
    fac1_token = progress_setup["fac1_token"]
    stu1_token = progress_setup["stu1_token"]
    lec1 = progress_setup["lec1"]
    q1_lec1 = progress_setup["q1_lec1"]
    q1_lec2 = progress_setup["q1_lec2"]

    # Create a 2nd question in lecture 1
    q2_same_lec1 = Quiz(lecture_id=lec1.id, question="Q2 Lec1 Same", options_json='["A", "B"]', correct_answer="A")
    session.add(q2_same_lec1)
    session.commit()

    # Scenario 1: Student attempts 2 questions in ONE lecture (q1_lec1, q2_same_lec1: 1 correct, 1 wrong)
    att1 = QuizAttempt(student_id=stu1.id, quiz_id=q1_lec1.id, score=1, selected_answer="A")
    att2 = QuizAttempt(student_id=stu1.id, quiz_id=q2_same_lec1.id, score=0, selected_answer="B")
    session.add_all([att1, att2])
    session.commit()

    # Check Student quiz-stats: 2 questions in 1 lecture quiz = total_attempts: 1, score: 50.0%
    res_stu = client.get("/students/quiz-stats", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_stu.status_code == 200
    data_stu = res_stu.json()
    assert data_stu["total_attempts"] == 1
    assert data_stu["average_score"] == 50.0

    # Check Faculty progress: quizzes_attempted: 1, avg_score: 50.0%
    res_fac = client.get("/faculty/student-progress", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res_fac.status_code == 200
    stu1_fac_item = next(item for item in res_fac.json() if item["student_id"] == stu1.id)
    assert stu1_fac_item["quizzes_attempted"] == 1
    assert stu1_fac_item["avg_score"] == 50.0

    # Scenario 2: Student adds an attempt in a SECOND lecture (q1_lec2: score 1)
    att3 = QuizAttempt(student_id=stu1.id, quiz_id=q1_lec2.id, score=1, selected_answer="A")
    session.add(att3)
    session.commit()

    # Now 3 questions across 2 lectures = total_attempts: 2, score: 66.67% (2 correct / 3 attempts)
    res_stu2 = client.get("/students/quiz-stats", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_stu2.status_code == 200
    data_stu2 = res_stu2.json()
    assert data_stu2["total_attempts"] == 2
    assert data_stu2["average_score"] == 66.67

    res_fac2 = client.get("/faculty/student-progress", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res_fac2.status_code == 200
    stu1_fac_item2 = next(item for item in res_fac2.json() if item["student_id"] == stu1.id)
    assert stu1_fac_item2["quizzes_attempted"] == 2
    assert stu1_fac_item2["avg_score"] == 66.67



def test_faculty_student_progress_restricted_to_owned_subjects(progress_setup):
    """Faculty endpoint restricts results to students enrolled in the faculty's own subjects/batches."""
    client = progress_setup["client"]
    session = progress_setup["session"]
    stu1 = progress_setup["stu1"]
    stu2 = progress_setup["stu2"]
    stu3 = progress_setup["stu3"]
    q1_lec1 = progress_setup["q1_lec1"]
    q1_lec2 = progress_setup["q1_lec2"]
    q1_lec3 = progress_setup["q1_lec3"]

    # Attempts:
    # stu1 (fac1 batch) attempts q1_lec1 (score 1) and q1_lec2 (score 0)
    a1 = QuizAttempt(student_id=stu1.id, quiz_id=q1_lec1.id, score=1, selected_answer="A")
    a2 = QuizAttempt(student_id=stu1.id, quiz_id=q1_lec2.id, score=0, selected_answer="B")
    # stu2 (enrolled in fac1 and fac2) attempts q1_lec1 (fac1) score 1 and q1_lec3 (fac2) score 1
    a3 = QuizAttempt(student_id=stu2.id, quiz_id=q1_lec1.id, score=1, selected_answer="A")
    a4 = QuizAttempt(student_id=stu2.id, quiz_id=q1_lec3.id, score=1, selected_answer="A")
    # stu3 (fac2 only) attempts q1_lec3 (fac2) score 0
    a5 = QuizAttempt(student_id=stu3.id, quiz_id=q1_lec3.id, score=0, selected_answer="B")
    session.add_all([a1, a2, a3, a4, a5])
    session.commit()

    # Fac1 request (owns sub1, batches: batch1, enrolled: stu1 and stu2)
    res_fac1 = client.get(
        "/faculty/student-progress",
        headers={"Authorization": f"Bearer {progress_setup['fac1_token']}"},
    )
    assert res_fac1.status_code == 200
    data_fac1 = res_fac1.json()

    # Verify stu3 (enrolled only under fac2) is NOT in fac1's response
    student_ids_fac1 = [item["student_id"] for item in data_fac1]
    assert stu1.id in student_ids_fac1
    assert stu2.id in student_ids_fac1
    assert stu3.id not in student_ids_fac1

    # Verify stu1 values under fac1 (2 attempts: 1 correct -> 50.0%)
    stu1_item = next(item for item in data_fac1 if item["student_id"] == stu1.id)
    assert stu1_item["name"] == stu1.name
    assert stu1_item["rollno"] == stu1.rollno
    assert stu1_item["quizzes_attempted"] == 2
    assert stu1_item["avg_score"] == 50.0

    # Verify stu2 values under fac1 (only 1 attempt under fac1's subjects -> 100.0%)
    stu2_item = next(item for item in data_fac1 if item["student_id"] == stu2.id)
    assert stu2_item["quizzes_attempted"] == 1
    assert stu2_item["avg_score"] == 100.0


def test_faculty_student_progress_faculty2_scope(progress_setup):
    """Faculty 2 receives only students enrolled in Faculty 2's subjects/batches."""
    client = progress_setup["client"]
    session = progress_setup["session"]
    stu2 = progress_setup["stu2"]
    stu3 = progress_setup["stu3"]
    q1_lec3 = progress_setup["q1_lec3"]

    a1 = QuizAttempt(student_id=stu2.id, quiz_id=q1_lec3.id, score=1, selected_answer="A")
    a2 = QuizAttempt(student_id=stu3.id, quiz_id=q1_lec3.id, score=0, selected_answer="B")
    session.add_all([a1, a2])
    session.commit()

    res_fac2 = client.get(
        "/faculty/student-progress",
        headers={"Authorization": f"Bearer {progress_setup['fac2_token']}"},
    )
    assert res_fac2.status_code == 200
    data_fac2 = res_fac2.json()

    student_ids_fac2 = [item["student_id"] for item in data_fac2]
    # stu1 is NOT enrolled in fac2's batch
    assert progress_setup["stu1"].id not in student_ids_fac2
    assert stu2.id in student_ids_fac2
    assert stu3.id in student_ids_fac2


def test_student_progress_endpoints_role_authorization(progress_setup):
    """Endpoints reject unauthenticated or mismatched role access."""
    client = progress_setup["client"]
    stu1_token = progress_setup["stu1_token"]
    fac1_token = progress_setup["fac1_token"]

    # Student endpoint called by faculty -> 403 Forbidden
    res1 = client.get("/students/quiz-stats", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res1.status_code == 403

    # Faculty endpoint called by student -> 403 Forbidden
    res2 = client.get("/faculty/student-progress", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res2.status_code == 403

    # Unauthenticated calls -> 401 Unauthorized
    assert client.get("/students/quiz-stats").status_code == 401
    assert client.get("/faculty/student-progress").status_code == 401
