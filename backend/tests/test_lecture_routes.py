import io
import os
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
from app.core import security
from app.services import storage_service


@pytest.fixture
def lecture_setup(monkeypatch):
    # Mock storage_service.upload_lecture_file so tests do not invoke real network calls
    mock_upload = MagicMock(return_value="lectures/mock_object_key_12345.mp3")
    monkeypatch.setattr(storage_service, "upload_lecture_file", mock_upload)

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

    # Enroll stu1 into Batch 1
    enr1 = Enrollment(student_id=stu1.id, batch_id=batch1.id)
    session.add(enr1)
    session.commit()

    # JWT Tokens
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
        "batch1": batch1,
        "batch2": batch2,
        "sub1": sub1,
        "sub2": sub2,
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
        "mock_upload": mock_upload,
        "session": session,
    }

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_faculty_can_upload_lecture(lecture_setup):
    client = lecture_setup["client"]
    token = lecture_setup["fac1_token"]
    batch_id = lecture_setup["batch1"].id
    mock_upload = lecture_setup["mock_upload"]

    audio_bytes = b"fake_mp3_audio_content_header_1234567890"
    file_data = ("lecture_1.mp3", io.BytesIO(audio_bytes), "audio/mpeg")

    response = client.post(
        "/lectures/upload",
        data={"title": "Introduction to OS", "batch_id": batch_id},
        files={"file": file_data},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Introduction to OS"
    assert data["batch_id"] == batch_id
    assert data["faculty_id"] == lecture_setup["fac1"].id
    assert data["original_filename"] == "lecture_1.mp3"
    assert data["file_size"] == len(audio_bytes)
    assert data["status"] == "uploaded"
    assert data["storage_path"] == "lectures/mock_object_key_12345.mp3"

    # Verify storage abstraction call
    mock_upload.assert_called_once()
    call_kwargs = mock_upload.call_args.kwargs
    assert call_kwargs["filename"] == "lecture_1.mp3"
    assert call_kwargs["file_bytes"] == audio_bytes


def test_student_cannot_upload_lecture(lecture_setup):
    client = lecture_setup["client"]
    token = lecture_setup["stu1_token"]
    batch_id = lecture_setup["batch1"].id

    audio_bytes = b"fake_audio_content"
    file_data = ("lecture.mp3", io.BytesIO(audio_bytes), "audio/mpeg")

    response = client.post(
        "/lectures/upload",
        data={"title": "Unauthorized Lecture", "batch_id": batch_id},
        files={"file": file_data},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Faculty access required"


def test_faculty_cannot_upload_to_another_faculty_batch(lecture_setup):
    client = lecture_setup["client"]
    fac2_token = lecture_setup["fac2_token"]
    fac1_batch_id = lecture_setup["batch1"].id

    audio_bytes = b"fake_audio_content"
    file_data = ("lecture.mp3", io.BytesIO(audio_bytes), "audio/mpeg")

    response = client.post(
        "/lectures/upload",
        data={"title": "Cross Faculty Upload", "batch_id": fac1_batch_id},
        files={"file": file_data},
        headers={"Authorization": f"Bearer {fac2_token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "You do not own the subject for this batch"


def test_unsupported_file_input_rejected(lecture_setup):
    client = lecture_setup["client"]
    token = lecture_setup["fac1_token"]
    batch_id = lecture_setup["batch1"].id

    # Test 1: Executable file extension
    file_exe = ("malicious.exe", io.BytesIO(b"executable content"), "application/octet-stream")
    r1 = client.post(
        "/lectures/upload",
        data={"title": "Test Title", "batch_id": batch_id},
        files={"file": file_exe},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r1.status_code == 400
    assert "Invalid audio file type" in r1.json()["detail"]

    # Test 2: Empty 0-byte audio file
    file_empty = ("empty.mp3", io.BytesIO(b""), "audio/mpeg")
    r2 = client.post(
        "/lectures/upload",
        data={"title": "Test Title", "batch_id": batch_id},
        files={"file": file_empty},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r2.status_code == 400
    assert "Uploaded file is empty" in r2.json()["detail"]


def test_faculty_sees_only_own_lectures(lecture_setup):
    client = lecture_setup["client"]
    fac1_token = lecture_setup["fac1_token"]
    fac2_token = lecture_setup["fac2_token"]

    # Fac 1 uploads lecture
    client.post(
        "/lectures/upload",
        data={"title": "OS Process Management", "batch_id": lecture_setup["batch1"].id},
        files={"file": ("os.mp3", io.BytesIO(b"os audio data"), "audio/mpeg")},
        headers={"Authorization": f"Bearer {fac1_token}"}
    )
    # Fac 2 uploads lecture
    client.post(
        "/lectures/upload",
        data={"title": "Lexical Analysis", "batch_id": lecture_setup["batch2"].id},
        files={"file": ("lexer.mp3", io.BytesIO(b"lexer audio data"), "audio/mpeg")},
        headers={"Authorization": f"Bearer {fac2_token}"}
    )

    # Fac 1 gets lectures (sees own lecture even if status is "uploaded")
    res1 = client.get("/lectures", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res1.status_code == 200
    lectures1 = res1.json()
    assert len(lectures1) == 1
    assert lectures1[0]["title"] == "OS Process Management"

    # Fac 2 gets lectures
    res2 = client.get("/lectures", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res2.status_code == 200
    lectures2 = res2.json()
    assert len(lectures2) == 1
    assert lectures2[0]["title"] == "Lexical Analysis"


def test_student_broadcast_access_gate_regression(lecture_setup):
    """Mandatory regression test verifying student broadcast access gate behavior."""
    client = lecture_setup["client"]
    fac1_token = lecture_setup["fac1_token"]
    stu1_token = lecture_setup["stu1_token"]
    stu2_token = lecture_setup["stu2_token"]
    session = lecture_setup["session"]

    # a) Faculty 1 uploads a lecture (status="uploaded")
    upload_res = client.post(
        "/lectures/upload",
        data={"title": "Virtual Memory", "batch_id": lecture_setup["batch1"].id},
        files={"file": ("vm.wav", io.BytesIO(b"virtual memory audio"), "audio/wav")},
        headers={"Authorization": f"Bearer {fac1_token}"}
    )
    assert upload_res.status_code == 201
    lecture_data = upload_res.json()
    lecture_id = lecture_data["id"]

    # b) Verify initial lecture status remains "uploaded"
    assert lecture_data["status"] == "uploaded"

    # c & d) Enrolled student (stu1) requests lecture list -> sees ZERO unbroadcast lectures
    res_list_unbroadcast = client.get("/lectures", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_list_unbroadcast.status_code == 200
    assert len(res_list_unbroadcast.json()) == 0

    # e) Enrolled student (stu1) requests individual unbroadcast lecture -> denied access (403)
    res_single_unbroadcast = client.get(f"/lectures/{lecture_id}", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_single_unbroadcast.status_code == 403
    assert res_single_unbroadcast.json()["detail"] == "Access denied for this lecture"

    # f) Directly update the lecture status to "broadcast" in the test database
    lecture_in_db = session.query(Lecture).filter(Lecture.id == lecture_id).first()
    lecture_in_db.status = "broadcast"
    session.commit()

    # g & h) Enrolled student (stu1) requests lecture list again -> can now see the lecture
    res_list_broadcast = client.get("/lectures", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_list_broadcast.status_code == 200
    broadcast_list = res_list_broadcast.json()
    assert len(broadcast_list) == 1
    assert broadcast_list[0]["title"] == "Virtual Memory"
    assert broadcast_list[0]["status"] == "broadcast"

    # i) Enrolled student (stu1) accesses the individual broadcast lecture -> 200 OK
    res_single_broadcast = client.get(f"/lectures/{lecture_id}", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_single_broadcast.status_code == 200
    assert res_single_broadcast.json()["title"] == "Virtual Memory"

    # Non-enrolled student (stu2) is still denied access even if broadcast
    res_non_enrolled_list = client.get("/lectures", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res_non_enrolled_list.status_code == 200
    assert len(res_non_enrolled_list.json()) == 0

    res_non_enrolled_single = client.get(f"/lectures/{lecture_id}", headers={"Authorization": f"Bearer {stu2_token}"})
    assert res_non_enrolled_single.status_code == 403
    assert res_non_enrolled_single.json()["detail"] == "Access denied for this lecture"
