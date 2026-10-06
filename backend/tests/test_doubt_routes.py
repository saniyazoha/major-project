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
from app.models.doubt import Doubt
from app.core import security


@pytest.fixture
def doubt_setup():
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

    # Seed Student 1 (Ada), Student 2 (Charles), Student 3 (Shannon)
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
    stu3 = Student(
        name="Claude Shannon",
        rollno="CS103",
        username="shannon",
        password_hash=security.hash_password("Pass123!"),
    )
    session.add_all([fac1, fac2, stu1, stu2, stu3])
    session.commit()

    # Seed Subject 1 & Batch 1 owned by Fac 1
    sub1 = Subject(name="Operating Systems", faculty_id=fac1.id)
    session.add(sub1)
    session.commit()

    batch1 = Batch(batchname="2026-A", subject_id=sub1.id)
    session.add(batch1)
    session.commit()

    # Seed Subject 2 & Batch 2 owned by Fac 2
    sub2 = Subject(name="Compilers", faculty_id=fac2.id)
    session.add(sub2)
    session.commit()

    batch2 = Batch(batchname="2026-B", subject_id=sub2.id)
    session.add(batch2)
    session.commit()

    # Enroll stu1 & stu2 into Batch 1; stu3 into Batch 2
    enr1 = Enrollment(student_id=stu1.id, batch_id=batch1.id)
    enr2 = Enrollment(student_id=stu2.id, batch_id=batch1.id)
    enr3 = Enrollment(student_id=stu3.id, batch_id=batch2.id)
    session.add_all([enr1, enr2, enr3])
    session.commit()

    # Create lectures under batch1 (Fac 1)
    lec1_broadcast = Lecture(
        title="Intro to OS",
        subject_id=sub1.id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="lec1.mp3",
        file_type="audio/mp3",
        file_size=1024,
        storage_path="path/to/lec1.mp3",
        status="broadcast",
    )
    lec1_draft = Lecture(
        title="OS Threads Draft",
        subject_id=sub1.id,
        batch_id=batch1.id,
        faculty_id=fac1.id,
        original_filename="lec2.mp3",
        file_type="audio/mp3",
        file_size=1024,
        storage_path="path/to/lec2.mp3",
        status="draft",
    )

    # Create lecture under batch2 (Fac 2)
    lec2_broadcast = Lecture(
        title="Intro to Compilers",
        subject_id=sub2.id,
        batch_id=batch2.id,
        faculty_id=fac2.id,
        original_filename="lec3.mp3",
        file_type="audio/mp3",
        file_size=1024,
        storage_path="path/to/lec3.mp3",
        status="broadcast",
    )
    session.add_all([lec1_broadcast, lec1_draft, lec2_broadcast])
    session.commit()

    # Tokens
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
        "lec1_broadcast": lec1_broadcast,
        "lec1_draft": lec1_draft,
        "lec2_broadcast": lec2_broadcast,
        "fac1_headers": {"Authorization": f"Bearer {fac1_token}"},
        "fac2_headers": {"Authorization": f"Bearer {fac2_token}"},
        "stu1_headers": {"Authorization": f"Bearer {stu1_token}"},
        "stu2_headers": {"Authorization": f"Bearer {stu2_token}"},
        "stu3_headers": {"Authorization": f"Bearer {stu3_token}"},
    }

    app.dependency_overrides.clear()


def test_student_submit_doubt_success(doubt_setup):
    client = doubt_setup["client"]
    lec_id = doubt_setup["lec1_broadcast"].id
    headers = doubt_setup["stu1_headers"]

    res = client.post(
        f"/lectures/{lec_id}/doubts",
        json={"question": "What is thread context switching?"},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["question"] == "What is thread context switching?"
    assert data["status"] == "pending"
    assert data["lecture_id"] == lec_id
    assert data["student_id"] == doubt_setup["stu1"].id
    assert data["student_name"] == "Ada Lovelace"
    assert data["student_rollno"] == "CS101"
    assert data["answer"] is None


def test_student_submit_doubt_invalid_question(doubt_setup):
    client = doubt_setup["client"]
    lec_id = doubt_setup["lec1_broadcast"].id
    headers = doubt_setup["stu1_headers"]

    res = client.post(
        f"/lectures/{lec_id}/doubts",
        json={"question": "   "},
        headers=headers,
    )
    assert res.status_code == 400
    assert "cannot be empty" in res.json()["detail"]


def test_student_cannot_submit_doubt_non_broadcast(doubt_setup):
    client = doubt_setup["client"]
    draft_id = doubt_setup["lec1_draft"].id
    headers = doubt_setup["stu1_headers"]

    res = client.post(
        f"/lectures/{draft_id}/doubts",
        json={"question": "Why is this lecture draft?"},
        headers=headers,
    )
    assert res.status_code == 403


def test_student_cannot_submit_doubt_non_enrolled(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    # stu3 is enrolled in batch2, not batch1
    headers = doubt_setup["stu3_headers"]

    res = client.post(
        f"/lectures/{lec1_id}/doubts",
        json={"question": "Can I ask about OS?"},
        headers=headers,
    )
    assert res.status_code == 403


def test_student_list_doubts_own_only(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    stu2_headers = doubt_setup["stu2_headers"]

    # Stu1 submits 2 doubts
    client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Stu1 Q1"}, headers=stu1_headers)
    client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Stu1 Q2"}, headers=stu1_headers)

    # Stu2 submits 1 doubt
    client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Stu2 Q1"}, headers=stu2_headers)

    # Stu1 lists doubts for lec1
    res1 = client.get(f"/lectures/{lec1_id}/doubts", headers=stu1_headers)
    assert res1.status_code == 200
    doubts1 = res1.json()
    assert len(doubts1) == 2
    assert all(d["student_id"] == doubt_setup["stu1"].id for d in doubts1)

    # Stu2 lists doubts for lec1
    res2 = client.get(f"/lectures/{lec1_id}/doubts", headers=stu2_headers)
    assert res2.status_code == 200
    doubts2 = res2.json()
    assert len(doubts2) == 1
    assert doubts2[0]["student_id"] == doubt_setup["stu2"].id


def test_student_cannot_access_other_student_doubt_by_id(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    stu2_headers = doubt_setup["stu2_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Private Q"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    # Stu1 can access own doubt
    res_get1 = client.get(f"/doubts/{doubt_id}", headers=stu1_headers)
    assert res_get1.status_code == 200

    # Stu2 cannot access Stu1's doubt
    res_get2 = client.get(f"/doubts/{doubt_id}", headers=stu2_headers)
    assert res_get2.status_code == 403


def test_faculty_list_doubts_own_lecture(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    stu2_headers = doubt_setup["stu2_headers"]
    fac1_headers = doubt_setup["fac1_headers"]

    client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Stu1 Q"}, headers=stu1_headers)
    client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Stu2 Q"}, headers=stu2_headers)

    res = client.get(f"/lectures/{lec1_id}/doubts", headers=fac1_headers)
    assert res.status_code == 200
    doubts = res.json()
    assert len(doubts) == 2


def test_faculty_cannot_list_doubts_other_faculty_lecture(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    fac2_headers = doubt_setup["fac2_headers"]

    res = client.get(f"/lectures/{lec1_id}/doubts", headers=fac2_headers)
    assert res.status_code == 403


def test_faculty_retrieve_doubt_by_id(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    fac1_headers = doubt_setup["fac1_headers"]
    fac2_headers = doubt_setup["fac2_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Fac retrieve test"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    # Fac 1 (owner) can retrieve
    res1 = client.get(f"/doubts/{doubt_id}", headers=fac1_headers)
    assert res1.status_code == 200

    # Fac 2 (non-owner) cannot retrieve
    res2 = client.get(f"/doubts/{doubt_id}", headers=fac2_headers)
    assert res2.status_code == 403


def test_faculty_answer_doubt_success(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    fac1_headers = doubt_setup["fac1_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "What is semaphore?"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    res_ans = client.patch(
        f"/doubts/{doubt_id}/answer",
        json={"answer": "A semaphore is a synchronization primitive."},
        headers=fac1_headers,
    )
    assert res_ans.status_code == 200
    data = res_ans.json()
    assert data["status"] == "answered"
    assert data["answer"] == "A semaphore is a synchronization primitive."
    assert data["answered_by"] == doubt_setup["fac1"].id
    assert data["answered_at"] is not None


def test_faculty_answer_doubt_empty_validation(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    fac1_headers = doubt_setup["fac1_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Valid question?"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    res_ans = client.patch(
        f"/doubts/{doubt_id}/answer",
        json={"answer": "   "},
        headers=fac1_headers,
    )
    assert res_ans.status_code == 400
    assert "cannot be empty" in res_ans.json()["detail"]


def test_non_owning_faculty_cannot_answer(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]
    fac2_headers = doubt_setup["fac2_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Fac2 try answer"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    res_ans = client.patch(
        f"/doubts/{doubt_id}/answer",
        json={"answer": "Fac2 answer attempt"},
        headers=fac2_headers,
    )
    assert res_ans.status_code == 403


def test_student_cannot_answer(doubt_setup):
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Student answer attempt"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    res_ans = client.patch(
        f"/doubts/{doubt_id}/answer",
        json={"answer": "Student answering self"},
        headers=stu1_headers,
    )
    assert res_ans.status_code == 403


def test_lecture_deletion_cascades_to_doubts(doubt_setup):
    session = doubt_setup["session"]
    client = doubt_setup["client"]
    lec1_id = doubt_setup["lec1_broadcast"].id
    stu1_headers = doubt_setup["stu1_headers"]

    res_post = client.post(f"/lectures/{lec1_id}/doubts", json={"question": "Cascade delete test"}, headers=stu1_headers)
    doubt_id = res_post.json()["id"]

    # Verify doubt exists
    doubt_obj = session.query(Doubt).filter(Doubt.id == doubt_id).first()
    assert doubt_obj is not None

    # Delete lecture
    lec_obj = session.query(Lecture).filter(Lecture.id == lec1_id).first()
    session.delete(lec_obj)
    session.commit()

    # Verify doubt is cascade deleted
    doubt_after = session.query(Doubt).filter(Doubt.id == doubt_id).first()
    assert doubt_after is None


def test_doubt_not_found(doubt_setup):
    client = doubt_setup["client"]
    fac1_headers = doubt_setup["fac1_headers"]
    stu1_headers = doubt_setup["stu1_headers"]

    res_get = client.get("/doubts/999999", headers=stu1_headers)
    assert res_get.status_code == 404

    res_ans = client.patch("/doubts/999999/answer", json={"answer": "Non-existent"}, headers=fac1_headers)
    assert res_ans.status_code == 404
