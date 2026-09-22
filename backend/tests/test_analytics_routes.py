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
from app.models.glossary import Glossary
from app.models.lecture_analytics import LectureAnalytics
from app.core import security


@pytest.fixture
def analytics_route_setup():
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
        password_hash=security.hash_password("Pass123!"),
    )
    fac2 = Faculty(
        name="Dr. Grace Hopper",
        username="hopper",
        password_hash=security.hash_password("Pass123!"),
    )

    # Seed Student 1 (Ada)
    stu1 = Student(
        name="Ada Lovelace",
        rollno="CS101",
        username="ada",
        password_hash=security.hash_password("Pass123!"),
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

    # Create JWT tokens
    fac1_token = security.create_access_token({"sub": str(fac1.id), "role": "faculty"})
    fac2_token = security.create_access_token({"sub": str(fac2.id), "role": "faculty"})
    stu1_token = security.create_access_token({"sub": str(stu1.id), "role": "student"})

    # Helper headers
    fac1_headers = {"Authorization": f"Bearer {fac1_token}"}
    fac2_headers = {"Authorization": f"Bearer {fac2_token}"}
    stu1_headers = {"Authorization": f"Bearer {stu1_token}"}

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
        "sub1": sub1,
        "batch1": batch1,
        "fac1_headers": fac1_headers,
        "fac2_headers": fac2_headers,
        "stu1_headers": stu1_headers,
    }

    app.dependency_overrides.clear()


# ============================================================================
# POST /lectures/{id}/analytics Tests
# ============================================================================

def test_post_analytics_owning_faculty_success(analytics_route_setup):
    """Req 1: Owning faculty can generate analytics successfully."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Paging & Virtual Memory",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="paging.mp3",
        file_type="audio/mpeg",
        file_size=2048,
        storage_path="lectures/paging.mp3",
        status="uploaded",
    )
    session.add(lec)
    session.commit()

    timestamps = json.dumps([{"start": 0.0, "end": 60.0, "text": "Paging separates address space into blocks."}])
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Paging separates address space into blocks.",
        corrected_text=None,
        segment_timestamps_json=timestamps,
        status="completed",
    )
    session.add(transcript)
    session.commit()

    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["lecture_id"] == lec.id
    assert "avg_wpm" in data
    assert "wpm_by_segment_json" in data
    assert "word_frequency_json" in data
    assert "filler_word_counts_json" in data
    assert "keyword_frequency_json" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_post_analytics_non_owning_faculty_forbidden(analytics_route_setup):
    """Req 2: Non-owning faculty receives 403."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="CPU Scheduling",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="cpu.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/cpu.mp3",
        status="uploaded",
    )
    session.add(lec)
    session.commit()

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Scheduling algorithms.",
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": "Scheduling algorithms."}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    # Fac 2 attempts POST to Fac 1's lecture
    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac2_headers"])
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_post_analytics_student_forbidden(analytics_route_setup):
    """Req 3: Student receives 403."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Draft Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="draft.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/draft.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["stu1_headers"])
    assert response.status_code == 403
    assert "Faculty access required" in response.json()["detail"]


def test_post_analytics_student_forbidden_on_broadcast_lecture(analytics_route_setup):
    """Req 4: Student receives 403 even when the lecture is broadcast."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Broadcasted Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="bcast.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/bcast.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Broadcasted text.",
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": "Broadcasted text."}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["stu1_headers"])
    assert response.status_code == 403
    assert "Faculty access required" in response.json()["detail"]


def test_post_analytics_missing_transcript_returns_409(analytics_route_setup):
    """Req 5: Missing transcript returns 409 Conflict."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="No Transcript Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="notrans.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/notrans.mp3",
        status="uploaded",
    )
    session.add(lec)
    session.commit()

    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 409
    assert "missing or not completed" in response.json()["detail"]


@pytest.mark.parametrize("status", ["uploaded", "processing", "failed"])
def test_post_analytics_incomplete_transcript_returns_409(analytics_route_setup, status):
    """Req 6: Incomplete transcript (uploaded, processing, failed) returns 409 Conflict."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title=f"Incomplete Transcript ({status})",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="inc.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/inc.mp3",
        status="uploaded",
    )
    session.add(lec)
    session.commit()

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Incomplete",
        status=status,
    )
    session.add(transcript)
    session.commit()

    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 409
    assert "missing or not completed" in response.json()["detail"]


@pytest.mark.parametrize("lec_status", ["uploaded", "draft", "generation_failed", "broadcast"])
def test_post_analytics_succeeds_for_any_lecture_status_with_completed_transcript(analytics_route_setup, lec_status):
    """Req 7: Completed transcript succeeds regardless of Lecture.status, provided caller is owning faculty."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title=f"Lecture in status {lec_status}",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="status.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/status.mp3",
        status=lec_status,
    )
    session.add(lec)
    session.commit()

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Text content for analytics.",
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": "Text content for analytics."}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    response = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 200, response.text
    assert response.json()["lecture_id"] == lec.id


def test_post_analytics_retrigger_overwrites_existing_row(analytics_route_setup):
    """Req 8: Re-triggering POST overwrites/recomputes existing analytics row rather than creating a duplicate."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Retrigger Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="retrigger.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/retrigger.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Initial text like um.",
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": "Initial text like um."}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    # Initial POST
    res1 = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert res1.status_code == 200
    id1 = res1.json()["id"]

    # Update transcript text
    transcript.corrected_text = "Updated text with basically so like like."
    session.commit()

    # Second POST
    res2 = client.post(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert res2.status_code == 200
    data2 = res2.json()

    assert data2["id"] == id1
    fillers = json.loads(data2["filler_word_counts_json"])
    assert fillers["like"] == 2
    assert fillers["basically"] == 1

    # Verify DB row count
    count = session.query(LectureAnalytics).filter(LectureAnalytics.lecture_id == lec.id).count()
    assert count == 1


# ============================================================================
# GET /lectures/{id}/analytics Tests
# ============================================================================

def test_get_analytics_owning_faculty_success(analytics_route_setup):
    """Req 9: Owning faculty can read persisted analytics."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="GET Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="get.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/get.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    analytics = LectureAnalytics(
        lecture_id=lec.id,
        avg_wpm=120.0,
        wpm_by_segment_json="[]",
        word_frequency_json='{"memory": 5}',
        filler_word_counts_json='{"like": 2}',
        keyword_frequency_json="{}",
    )
    session.add(analytics)
    session.commit()

    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["lecture_id"] == lec.id
    assert data["avg_wpm"] == 120.0
    assert json.loads(data["word_frequency_json"])["memory"] == 5


def test_get_analytics_non_owning_faculty_forbidden(analytics_route_setup):
    """Req 10: Non-owning faculty receives 403."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Fac1 Private Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="fac1.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/fac1.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    analytics = LectureAnalytics(
        lecture_id=lec.id,
        avg_wpm=100.0,
        wpm_by_segment_json="[]",
        word_frequency_json="{}",
        filler_word_counts_json="{}",
        keyword_frequency_json="{}",
    )
    session.add(analytics)
    session.commit()

    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["fac2_headers"])
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_get_analytics_student_forbidden(analytics_route_setup):
    """Req 11: Student receives 403."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Draft Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="draft.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/draft.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    analytics = LectureAnalytics(
        lecture_id=lec.id,
        avg_wpm=100.0,
        wpm_by_segment_json="[]",
        word_frequency_json="{}",
        filler_word_counts_json="{}",
        keyword_frequency_json="{}",
    )
    session.add(analytics)
    session.commit()

    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["stu1_headers"])
    assert response.status_code == 403
    assert "Faculty access required" in response.json()["detail"]


def test_get_analytics_student_forbidden_on_broadcast_lecture(analytics_route_setup):
    """Req 12: Student receives 403 even when lecture is broadcast."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Broadcasted Public Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="bcast.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/bcast.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    analytics = LectureAnalytics(
        lecture_id=lec.id,
        avg_wpm=115.0,
        wpm_by_segment_json="[]",
        word_frequency_json="{}",
        filler_word_counts_json="{}",
        keyword_frequency_json="{}",
    )
    session.add(analytics)
    session.commit()

    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["stu1_headers"])
    assert response.status_code == 403
    assert "Faculty access required" in response.json()["detail"]


def test_get_analytics_before_generation_returns_404(analytics_route_setup):
    """Req 13: GET before analytics has been generated returns 404 Not Found."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="No Analytics Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="noan.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/noan.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 404
    assert "Analytics not found" in response.json()["detail"]


def test_get_analytics_is_read_only_does_not_create_row(analytics_route_setup):
    """Req 14: GET does not create an analytics row (read-only)."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Read Only Check",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="readonly.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/readonly.mp3",
        status="draft",
    )
    session.add(lec)
    session.commit()

    # GET returns 404
    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 404

    # Verify no row created in DB
    count = session.query(LectureAnalytics).filter(LectureAnalytics.lecture_id == lec.id).count()
    assert count == 0


def test_get_analytics_does_not_mutate_entities(analytics_route_setup):
    """Req 15: GET does not mutate transcript, lecture, or other content."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    lec = Lecture(
        title="Mutation Check",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="mut.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/mut.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Raw text",
        corrected_text="Corrected text",
        status="completed",
    )
    session.add(transcript)

    analytics = LectureAnalytics(
        lecture_id=lec.id,
        avg_wpm=95.0,
        wpm_by_segment_json="[]",
        word_frequency_json="{}",
        filler_word_counts_json="{}",
        keyword_frequency_json="{}",
    )
    session.add(analytics)
    session.commit()

    # Execute GET
    response = client.get(f"/lectures/{lec.id}/analytics", headers=setup["fac1_headers"])
    assert response.status_code == 200

    # Reload from DB
    session.refresh(lec)
    session.refresh(transcript)

    assert lec.status == "broadcast"
    assert transcript.raw_text == "Raw text"
    assert transcript.corrected_text == "Corrected text"
    assert transcript.status == "completed"


def test_authorization_regression_analytics_vs_notes_for_student_on_broadcast_lecture(analytics_route_setup):
    """Req Additional: Test that analytics endpoints do NOT inherit student broadcast-access behavior used by other content endpoints."""
    setup = analytics_route_setup
    client, session = setup["client"], setup["session"]

    # Broadcast lecture enrolled student Stu1
    lec = Lecture(
        title="Broadcasted Operating Systems Lecture",
        subject_id=setup["sub1"].id,
        batch_id=setup["batch1"].id,
        faculty_id=setup["fac1"].id,
        original_filename="bcast_os.mp3",
        file_type="audio/mpeg",
        file_size=2048,
        storage_path="lectures/bcast_os.mp3",
        status="broadcast",
    )
    session.add(lec)
    session.commit()

    note = Note(
        lecture_id=lec.id,
        markdown_content="# OS Notes",
        summary_text="OS Summary",
    )
    session.add(note)

    analytics = LectureAnalytics(
        lecture_id=lec.id,
        avg_wpm=110.0,
        wpm_by_segment_json="[]",
        word_frequency_json="{}",
        filler_word_counts_json="{}",
        keyword_frequency_json="{}",
    )
    session.add(analytics)
    session.commit()

    # 1. Student accesses notes on broadcast lecture -> 200 OK (Unit 2 content read behavior works for student)
    res_notes = client.get(f"/lectures/{lec.id}/notes", headers=setup["stu1_headers"])
    assert res_notes.status_code == 200
    assert res_notes.json()["markdown_content"] == "# OS Notes"

    # 2. Student accesses analytics GET on exact same broadcast lecture -> 403 Forbidden
    res_get_an = client.get(f"/lectures/{lec.id}/analytics", headers=setup["stu1_headers"])
    assert res_get_an.status_code == 403
    assert "Faculty access required" in res_get_an.json()["detail"]

    # 3. Student accesses analytics POST on exact same broadcast lecture -> 403 Forbidden
    res_post_an = client.post(f"/lectures/{lec.id}/analytics", headers=setup["stu1_headers"])
    assert res_post_an.status_code == 403
    assert "Faculty access required" in res_post_an.json()["detail"]


def test_analytics_non_existent_lecture_returns_404(analytics_route_setup):
    """Req Non-existent: Non-existent lecture ID returns 404 for both POST and GET."""
    setup = analytics_route_setup
    client = setup["client"]

    non_existent_id = 99999

    res_post = client.post(f"/lectures/{non_existent_id}/analytics", headers=setup["fac1_headers"])
    assert res_post.status_code == 404
    assert "Lecture not found" in res_post.json()["detail"]

    res_get = client.get(f"/lectures/{non_existent_id}/analytics", headers=setup["fac1_headers"])
    assert res_get.status_code == 404
    assert "Lecture not found" in res_get.json()["detail"]
