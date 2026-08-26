import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError
from app.db.base import Base
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.core import security


@pytest.fixture
def transcript_db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed prerequisite Faculty, Subject, Batch, Lecture
    fac = Faculty(
        name="Dr. Alan Turing",
        username="turing",
        password_hash=security.hash_password("Pass123!")
    )
    session.add(fac)
    session.commit()

    sub = Subject(name="Operating Systems", faculty_id=fac.id)
    session.add(sub)
    session.commit()

    batch = Batch(subject_id=sub.id, batchname="Section-A")
    session.add(batch)
    session.commit()

    lec = Lecture(
        title="Introduction to Threads",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="threads.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/threads_uuid.mp3",
        status="uploaded"
    )
    session.add(lec)
    session.commit()

    yield {
        "session": session,
        "faculty": fac,
        "subject": sub,
        "batch": batch,
        "lecture": lec
    }

    session.close()
    Base.metadata.drop_all(bind=engine)


def test_transcript_model_creation_and_relationship(transcript_db_session):
    session = transcript_db_session["session"]
    lec = transcript_db_session["lecture"]

    # Initial lecture has no transcript
    assert lec.transcript is None

    # Create transcript
    timestamps_sample = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Hello"}])
    t = Transcript(
        lecture_id=lec.id,
        raw_text="Hello and welcome to operating systems class.",
        corrected_text=None,
        segment_timestamps_json=timestamps_sample,
        status="completed"
    )
    session.add(t)
    session.commit()

    # Re-query lecture and verify 1:1 relationship
    reloaded_lec = session.query(Lecture).filter(Lecture.id == lec.id).first()
    assert reloaded_lec.transcript is not None
    assert reloaded_lec.transcript.id == t.id
    assert reloaded_lec.transcript.lecture_id == lec.id
    assert reloaded_lec.transcript.raw_text == "Hello and welcome to operating systems class."
    assert reloaded_lec.transcript.corrected_text is None
    assert reloaded_lec.transcript.segment_timestamps_json == timestamps_sample
    assert reloaded_lec.transcript.status == "completed"
    assert reloaded_lec.transcript.error_message is None
    assert reloaded_lec.transcript.created_at is not None
    assert reloaded_lec.transcript.updated_at is not None


def test_one_transcript_per_lecture_uniqueness(transcript_db_session):
    session = transcript_db_session["session"]
    lec = transcript_db_session["lecture"]

    t1 = Transcript(
        lecture_id=lec.id,
        raw_text="First transcript",
        status="completed"
    )
    session.add(t1)
    session.commit()

    # Attempting to add a second transcript for the same lecture must raise IntegrityError
    t2 = Transcript(
        lecture_id=lec.id,
        raw_text="Second transcript attempting duplicate",
        status="completed"
    )
    session.add(t2)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_transcript_failed_state_and_error_message(transcript_db_session):
    session = transcript_db_session["session"]
    lec = transcript_db_session["lecture"]

    t = Transcript(
        lecture_id=lec.id,
        status="failed",
        error_message="Groq ASR API request timed out after 30 seconds"
    )
    session.add(t)
    session.commit()

    saved_transcript = session.query(Transcript).filter(Transcript.lecture_id == lec.id).first()
    assert saved_transcript.status == "failed"
    assert saved_transcript.raw_text is None
    assert saved_transcript.corrected_text is None
    assert saved_transcript.segment_timestamps_json is None
    assert saved_transcript.error_message == "Groq ASR API request timed out after 30 seconds"


def test_transcript_cascade_delete_with_lecture(transcript_db_session):
    session = transcript_db_session["session"]
    lec = transcript_db_session["lecture"]

    t = Transcript(
        lecture_id=lec.id,
        raw_text="Cascade delete test transcript",
        status="completed"
    )
    session.add(t)
    session.commit()

    # Delete lecture
    session.delete(lec)
    session.commit()

    # Verify transcript is automatically deleted
    saved_transcript = session.query(Transcript).filter(Transcript.id == t.id).first()
    assert saved_transcript is None
