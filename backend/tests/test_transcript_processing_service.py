import json
import pytest
import time
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.core import security
from app.services import (
    transcript_processing_service,
    storage_service,
    audio_chunking_service,
    transcription_service,
)
from app.services.transcript_processing_service import TranscriptProcessingError
from app.services.storage_service import StorageError
from app.services.audio_chunking_service import AudioChunkingError
from app.services.transcription_service import TranscriptionError


@pytest.fixture
def orchestration_db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Seed Faculty, Subject, Batch, Lecture
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
        title="Process Scheduling",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="scheduling.mp3",
        file_type="audio/mpeg",
        file_size=2048,
        storage_path="lectures/scheduling_uuid.mp3",
        status="uploaded"
    )
    session.add(lec)
    session.commit()

    # Create associated transcript record
    t = Transcript(lecture_id=lec.id, status="uploaded")
    session.add(t)
    session.commit()

    yield {
        "session": session,
        "faculty": fac,
        "subject": sub,
        "batch": batch,
        "lecture": lec,
        "transcript": t,
    }

    session.close()
    Base.metadata.drop_all(bind=engine)


def test_missing_lecture_raises_error(orchestration_db_session):
    session = orchestration_db_session["session"]
    with pytest.raises(TranscriptProcessingError) as exc_info:
        transcript_processing_service.process_lecture_transcription(session, lecture_id=9999)
    assert "Lecture with ID 9999 not found" in str(exc_info.value)


def test_status_set_to_processing_before_external_work(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]

    observed_status_during_download = []

    def mock_download(path):
        t_in_db = session.query(Transcript).filter(Transcript.lecture_id == lec.id).first()
        observed_status_during_download.append(t_in_db.status)
        return b"mock_audio_bytes"

    monkeypatch.setattr(storage_service, "download_lecture_file", mock_download)
    monkeypatch.setattr(
        audio_chunking_service,
        "chunk_audio_bytes",
        lambda file_bytes, filename: [{
            "chunk_index": 0,
            "start_time": 0.0,
            "end_time": 10.0,
            "file_bytes": file_bytes,
            "filename": "chunk_0.mp3"
        }]
    )
    monkeypatch.setattr(
        transcription_service,
        "translate_audio_to_english",
        lambda audio_file, filename: {
            "text": "Process scheduling lecture transcript.",
            "segments": [{"id": 0, "start": 0.0, "end": 10.0, "text": "Process scheduling lecture transcript."}]
        }
    )

    result = transcript_processing_service.process_lecture_transcription(session, lec.id, backoff_seconds=0.0)
    assert observed_status_during_download == ["processing"]
    assert result.status == "completed"
    assert result.raw_text == "Process scheduling lecture transcript."
    assert result.corrected_text is None
    assert result.segment_timestamps_json is not None
    timestamps = json.loads(result.segment_timestamps_json)
    assert len(timestamps) == 1
    assert timestamps[0]["start"] == 0.0
    assert timestamps[0]["end"] == 10.0


def test_successful_single_chunk_processing(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]

    monkeypatch.setattr(storage_service, "download_lecture_file", lambda path: b"audio_bytes_123")
    monkeypatch.setattr(
        audio_chunking_service,
        "chunk_audio_bytes",
        lambda file_bytes, filename: [{
            "chunk_index": 0,
            "start_time": 0.0,
            "end_time": 100.0,
            "file_bytes": file_bytes,
            "filename": "scheduling_chunk_0.mp3"
        }]
    )
    monkeypatch.setattr(
        transcription_service,
        "translate_audio_to_english",
        lambda audio_file, filename: {
            "text": "Single chunk translation complete.",
            "segments": [{"id": 0, "start": 1.5, "end": 12.0, "text": "Single chunk translation complete."}]
        }
    )

    transcript = transcript_processing_service.process_lecture_transcription(session, lec.id, backoff_seconds=0.0)

    assert transcript.status == "completed"
    assert transcript.raw_text == "Single chunk translation complete."
    assert transcript.corrected_text is None
    assert transcript.error_message is None
    assert transcript.segment_timestamps_json is not None

    segments = json.loads(transcript.segment_timestamps_json)
    assert len(segments) == 1
    assert segments[0]["start"] == 1.5
    assert segments[0]["end"] == 12.0


def test_successful_multi_chunk_processing_combines_in_order_with_offset_timestamps(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]

    monkeypatch.setattr(storage_service, "download_lecture_file", lambda path: b"long_audio_bytes")
    monkeypatch.setattr(
        audio_chunking_service,
        "chunk_audio_bytes",
        lambda file_bytes, filename: [
            {"chunk_index": 0, "start_time": 0.0, "end_time": 170.0, "file_bytes": b"c0", "filename": "chunk_0.mp3"},
            {"chunk_index": 1, "start_time": 170.0, "end_time": 340.0, "file_bytes": b"c1", "filename": "chunk_1.mp3"},
            {"chunk_index": 2, "start_time": 340.0, "end_time": 400.0, "file_bytes": b"c2", "filename": "chunk_2.mp3"},
        ]
    )

    translation_calls = []

    def mock_translate(audio_file, filename):
        translation_calls.append(filename)
        if filename == "chunk_0.mp3":
            return {
                "text": "First section on CPU cycles.",
                "segments": [{"id": 0, "start": 0.5, "end": 10.0, "text": "First section on CPU cycles."}]
            }
        elif filename == "chunk_1.mp3":
            # Chunk 1 starts at 170.0s. Segment start 5.0 -> global start 175.0, end 15.0 -> global end 185.0
            return {
                "text": "Second section on round robin queues.",
                "segments": [{"id": 0, "start": 5.0, "end": 15.0, "text": "Second section on round robin queues."}]
            }
        else:
            # Chunk 2 starts at 340.0s. Segment start 2.5 -> global start 342.5, end 12.5 -> global end 352.5
            return {
                "text": "Third section on context switching.",
                "segments": [{"id": 0, "start": 2.5, "end": 12.5, "text": "Third section on context switching."}]
            }

    monkeypatch.setattr(transcription_service, "translate_audio_to_english", mock_translate)

    transcript = transcript_processing_service.process_lecture_transcription(session, lec.id, backoff_seconds=0.0)

    assert translation_calls == ["chunk_0.mp3", "chunk_1.mp3", "chunk_2.mp3"]
    assert transcript.status == "completed"
    assert transcript.raw_text == "First section on CPU cycles. Second section on round robin queues. Third section on context switching."
    assert transcript.corrected_text is None
    assert transcript.error_message is None

    # Verify offset arithmetic in multi-chunk timestamps
    assert transcript.segment_timestamps_json is not None
    segments = json.loads(transcript.segment_timestamps_json)
    assert len(segments) == 3

    # Chunk 0: 0.0 + 0.5 = 0.5, 0.0 + 10.0 = 10.0
    assert segments[0]["start"] == 0.5
    assert segments[0]["end"] == 10.0

    # Chunk 1: 170.0 + 5.0 = 175.0, 170.0 + 15.0 = 185.0
    assert segments[1]["start"] == 175.0
    assert segments[1]["end"] == 185.0

    # Chunk 2: 340.0 + 2.5 = 342.5, 340.0 + 12.5 = 352.5
    assert segments[2]["start"] == 342.5
    assert segments[2]["end"] == 352.5

    # Verify chronological ordering
    assert segments[0]["start"] < segments[1]["start"] < segments[2]["start"]


def test_storage_failure_marks_transcript_failed(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]

    def mock_download_fail(path):
        raise StorageError("Object not found in Supabase Storage")

    monkeypatch.setattr(storage_service, "download_lecture_file", mock_download_fail)

    with pytest.raises(TranscriptProcessingError) as exc_info:
        transcript_processing_service.process_lecture_transcription(session, lec.id, backoff_seconds=0.0)

    assert "Object not found in Supabase Storage" in str(exc_info.value)

    t_in_db = session.query(Transcript).filter(Transcript.lecture_id == lec.id).first()
    assert t_in_db.status == "failed"
    assert t_in_db.raw_text is None
    assert t_in_db.corrected_text is None
    assert t_in_db.segment_timestamps_json is None
    assert "Object not found in Supabase Storage" in t_in_db.error_message


def test_chunking_failure_marks_transcript_failed(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]

    monkeypatch.setattr(storage_service, "download_lecture_file", lambda path: b"corrupted_bytes")

    def mock_chunk_fail(file_bytes, filename):
        raise AudioChunkingError("ffprobe failed to probe audio duration")

    monkeypatch.setattr(audio_chunking_service, "chunk_audio_bytes", mock_chunk_fail)

    with pytest.raises(TranscriptProcessingError) as exc_info:
        transcript_processing_service.process_lecture_transcription(session, lec.id, backoff_seconds=0.0)

    assert "ffprobe failed to probe audio duration" in str(exc_info.value)

    t_in_db = session.query(Transcript).filter(Transcript.lecture_id == lec.id).first()
    assert t_in_db.status == "failed"
    assert t_in_db.raw_text is None
    assert t_in_db.corrected_text is None
    assert t_in_db.segment_timestamps_json is None
    assert "ffprobe failed to probe audio duration" in t_in_db.error_message


def test_chunk_retry_first_attempt_fails_retry_succeeds(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]
    monkeypatch.setattr(time, "sleep", lambda s: None)

    monkeypatch.setattr(storage_service, "download_lecture_file", lambda path: b"audio_bytes")
    monkeypatch.setattr(
        audio_chunking_service,
        "chunk_audio_bytes",
        lambda file_bytes, filename: [{
            "chunk_index": 0, "start_time": 0.0, "end_time": 100.0, "file_bytes": b"c0", "filename": "chunk_0.mp3"
        }]
    )

    attempt_count = 0

    def mock_translate_retry(audio_file, filename):
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count == 1:
            raise TranscriptionError("Groq ASR rate limit temporary error")
        return {
            "text": "Recovered text on attempt 2.",
            "segments": [{"id": 0, "start": 0.0, "end": 5.0, "text": "Recovered text on attempt 2."}]
        }

    monkeypatch.setattr(transcription_service, "translate_audio_to_english", mock_translate_retry)

    transcript = transcript_processing_service.process_lecture_transcription(session, lec.id, backoff_seconds=0.0)

    assert attempt_count == 2
    assert transcript.status == "completed"
    assert transcript.raw_text == "Recovered text on attempt 2."
    assert transcript.corrected_text is None
    assert transcript.segment_timestamps_json is not None
    assert transcript.error_message is None


def test_chunk_retry_multiple_failures_then_succeeds(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]
    monkeypatch.setattr(time, "sleep", lambda s: None)

    monkeypatch.setattr(storage_service, "download_lecture_file", lambda path: b"audio_bytes")
    monkeypatch.setattr(
        audio_chunking_service,
        "chunk_audio_bytes",
        lambda file_bytes, filename: [{
            "chunk_index": 0, "start_time": 0.0, "end_time": 100.0, "file_bytes": b"c0", "filename": "chunk_0.mp3"
        }]
    )

    attempt_count = 0

    def mock_translate_multi_retry(audio_file, filename):
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count < 3:
            raise TranscriptionError(f"Transient Groq error attempt {attempt_count}")
        return {
            "text": "Recovered text on attempt 3.",
            "segments": [{"id": 0, "start": 0.0, "end": 5.0, "text": "Recovered text on attempt 3."}]
        }

    monkeypatch.setattr(transcription_service, "translate_audio_to_english", mock_translate_multi_retry)

    transcript = transcript_processing_service.process_lecture_transcription(session, lec.id, max_retries=3, backoff_seconds=0.0)

    assert attempt_count == 3
    assert transcript.status == "completed"
    assert transcript.raw_text == "Recovered text on attempt 3."
    assert transcript.corrected_text is None
    assert transcript.segment_timestamps_json is not None


def test_chunk_retries_exhausted_marks_failed_and_halts_later_chunks(orchestration_db_session, monkeypatch):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]
    monkeypatch.setattr(time, "sleep", lambda s: None)

    monkeypatch.setattr(storage_service, "download_lecture_file", lambda path: b"audio_bytes")
    monkeypatch.setattr(
        audio_chunking_service,
        "chunk_audio_bytes",
        lambda file_bytes, filename: [
            {"chunk_index": 0, "start_time": 0.0, "end_time": 170.0, "file_bytes": b"c0", "filename": "chunk_0.mp3"},
            {"chunk_index": 1, "start_time": 170.0, "end_time": 340.0, "file_bytes": b"c1", "filename": "chunk_1.mp3"},
        ]
    )

    processed_calls = []

    def mock_always_fail_chunk_0(audio_file, filename):
        processed_calls.append(filename)
        raise TranscriptionError("Persistent Groq 500 Internal Error")

    monkeypatch.setattr(transcription_service, "translate_audio_to_english", mock_always_fail_chunk_0)

    with pytest.raises(TranscriptProcessingError) as exc_info:
        transcript_processing_service.process_lecture_transcription(session, lec.id, max_retries=3, backoff_seconds=0.0)

    # Chunk 0 was attempted 3 times; Chunk 1 was NEVER attempted
    assert processed_calls == ["chunk_0.mp3", "chunk_0.mp3", "chunk_0.mp3"]
    assert "Persistent Groq 500 Internal Error" in str(exc_info.value)

    t_in_db = session.query(Transcript).filter(Transcript.lecture_id == lec.id).first()
    assert t_in_db.status == "failed"
    assert t_in_db.raw_text is None
    assert t_in_db.corrected_text is None
    assert t_in_db.segment_timestamps_json is None
    assert "Persistent Groq 500 Internal Error" in t_in_db.error_message


# =====================================================================
# Service-Level Tests for update_corrected_transcript
# =====================================================================

def test_update_corrected_transcript_not_found(orchestration_db_session):
    session = orchestration_db_session["session"]
    result, error = transcript_processing_service.update_corrected_transcript(
        session, lecture_id=9999, corrected_text="Updated text"
    )
    assert result is None
    assert error == "TRANSCRIPT_NOT_FOUND"


def test_update_corrected_transcript_not_completed(orchestration_db_session):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]
    t = orchestration_db_session["transcript"]

    # Status is "uploaded"
    result, error = transcript_processing_service.update_corrected_transcript(
        session, lecture_id=lec.id, corrected_text="Updated text"
    )
    assert result is None
    assert error == "TRANSCRIPT_NOT_READY"

    # Status is "processing"
    t.status = "processing"
    session.commit()
    result, error = transcript_processing_service.update_corrected_transcript(
        session, lecture_id=lec.id, corrected_text="Updated text"
    )
    assert result is None
    assert error == "TRANSCRIPT_NOT_READY"

    # Status is "failed"
    t.status = "failed"
    session.commit()
    result, error = transcript_processing_service.update_corrected_transcript(
        session, lecture_id=lec.id, corrected_text="Updated text"
    )
    assert result is None
    assert error == "TRANSCRIPT_NOT_READY"


def test_update_corrected_transcript_success_and_invariants(orchestration_db_session):
    session = orchestration_db_session["session"]
    lec = orchestration_db_session["lecture"]
    t = orchestration_db_session["transcript"]

    sample_timestamps = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Raw text"}])
    t.raw_text = "Original raw ASR transcript text."
    t.segment_timestamps_json = sample_timestamps
    t.status = "completed"
    t.corrected_text = None
    session.commit()

    updated_t, error = transcript_processing_service.update_corrected_transcript(
        session, lecture_id=lec.id, corrected_text="Faculty corrected text."
    )

    assert error is None
    assert updated_t is not None
    assert updated_t.corrected_text == "Faculty corrected text."

    # Direct invariant assertions
    assert updated_t.raw_text == "Original raw ASR transcript text."
    assert updated_t.segment_timestamps_json == sample_timestamps
    assert updated_t.status == "completed"
    assert lec.status == "uploaded"
