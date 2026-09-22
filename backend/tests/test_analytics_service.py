import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.glossary import Glossary
from app.models.lecture_analytics import LectureAnalytics
from app.services.analytics_service import (
    TranscriptNotCompletedError,
    compute_and_save_lecture_analytics,
    compute_filler_word_counts,
    compute_keyword_frequency,
    compute_wpm_from_timestamps,
    compute_word_frequency,
    select_source_text,
)


@pytest.fixture
def analytics_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    fac = Faculty(name="Dr. Ada Lovelace", username="lovelace", password_hash="pass123")
    session.add(fac)
    session.commit()

    sub = Subject(name="Algorithms & Data Structures", faculty_id=fac.id)
    session.add(sub)
    session.commit()

    batch = Batch(subject_id=sub.id, batchname="CS-101")
    session.add(batch)
    session.commit()

    lec = Lecture(
        title="Sorting Algorithms",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="sorting.mp3",
        file_type="audio/mpeg",
        file_size=2048,
        storage_path="lectures/sorting.mp3",
        status="uploaded",
    )
    session.add(lec)
    session.commit()

    yield session, lec

    session.close()


def test_completed_transcript_produces_analytics_success(analytics_db):
    """Req 1: Completed transcript successfully produces analytics."""
    session, lec = analytics_db

    timestamps = json.dumps([
        {"id": 0, "start": 0.0, "end": 60.0, "text": "Welcome to sorting algorithms class today."}
    ])
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Welcome to sorting algorithms class today.",
        corrected_text=None,
        segment_timestamps_json=timestamps,
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    assert analytics is not None
    assert analytics.lecture_id == lec.id
    assert analytics.avg_wpm == 6.0  # 6 words in 60 sec = 6 WPM
    
    saved_analytics = session.query(LectureAnalytics).filter(LectureAnalytics.lecture_id == lec.id).first()
    assert saved_analytics is not None
    assert saved_analytics.id == analytics.id
    assert json.loads(saved_analytics.filler_word_counts_json)["like"] == 0
    assert json.loads(saved_analytics.keyword_frequency_json) == {}


def test_missing_transcript_raises_domain_error(analytics_db):
    """Req 2: Missing transcript produces the service/domain error (TranscriptNotCompletedError)."""
    session, lec = analytics_db

    with pytest.raises(TranscriptNotCompletedError) as exc_info:
        compute_and_save_lecture_analytics(session, lec.id)

    assert f"lecture {lec.id}" in str(exc_info.value)
    assert "missing or not completed" in str(exc_info.value)


@pytest.mark.parametrize("status", ["uploaded", "processing", "failed"])
def test_incomplete_transcript_status_rejected(analytics_db, status):
    """Req 3: Incomplete transcript (uploaded, processing, failed) is rejected."""
    session, lec = analytics_db

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Partial text",
        corrected_text=None,
        segment_timestamps_json=None,
        status=status,
    )
    session.add(transcript)
    session.commit()

    with pytest.raises(TranscriptNotCompletedError) as exc_info:
        compute_and_save_lecture_analytics(session, lec.id)

    assert "missing or not completed" in str(exc_info.value)


def test_wpm_calculated_from_segment_timestamps_json(analytics_db):
    """Req 4: WPM is calculated strictly from segment_timestamps_json."""
    session, lec = analytics_db

    # Segment 1: 10 words in 30 sec (20 WPM)
    # Segment 2: 20 words in 30 sec (40 WPM)
    # Total: 30 words in 60 sec = 30.0 WPM overall
    seg1 = "One two three four five six seven eight nine ten"
    seg2 = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty"
    timestamps = json.dumps([
        {"id": 0, "start": 0.0, "end": 30.0, "text": seg1},
        {"id": 1, "start": 30.0, "end": 60.0, "text": seg2},
    ])

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=f"{seg1} {seg2}",
        corrected_text=None,
        segment_timestamps_json=timestamps,
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    assert analytics.avg_wpm == 30.0
    segments = json.loads(analytics.wpm_by_segment_json)
    assert len(segments) == 2
    assert segments[0]["wpm"] == 20.0
    assert segments[1]["wpm"] == 40.0


def test_wpm_does_not_switch_to_corrected_text_word_counts(analytics_db):
    """Req 5: WPM does NOT switch to corrected-text word counts when corrected_text exists."""
    session, lec = analytics_db

    # Timestamps: 6 words in 60s -> WPM = 6.0
    timestamps = json.dumps([
        {"id": 0, "start": 0.0, "end": 60.0, "text": "Word one word two word three"}
    ])
    # Corrected text has 100 words!
    long_corrected = "word " * 100

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Word one word two word three",
        corrected_text=long_corrected.strip(),
        segment_timestamps_json=timestamps,
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    # Must be 6.0 WPM (from timestamped segments), NOT 100.0 WPM
    assert analytics.avg_wpm == 6.0
    segments = json.loads(analytics.wpm_by_segment_json)
    assert segments[0]["word_count"] == 6
    assert segments[0]["wpm"] == 6.0


def test_word_frequency_uses_corrected_text_when_available(analytics_db):
    """Req 6: Word frequency uses corrected text when corrected_text exists."""
    session, lec = analytics_db

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="apple banana cherry",
        corrected_text="orange grape papaya orange",
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": "apple banana cherry"}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    word_freq = json.loads(analytics.word_frequency_json)
    assert "orange" in word_freq
    assert word_freq["orange"] == 2
    assert "grape" in word_freq
    assert "papaya" in word_freq
    # Raw text words must NOT be present
    assert "apple" not in word_freq
    assert "banana" not in word_freq


def test_word_frequency_falls_back_to_raw_text_when_corrected_is_none(analytics_db):
    """Req 7: Word frequency falls back to raw text when corrected_text is None."""
    session, lec = analytics_db

    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="apple banana apple",
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": "apple banana apple"}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    word_freq = json.loads(analytics.word_frequency_json)
    assert word_freq["apple"] == 2
    assert word_freq["banana"] == 1


def test_filler_words_counted_case_insensitively(analytics_db):
    """Req 8: Filler words are counted case-insensitively."""
    session, lec = analytics_db

    text = "So basically LIKE Actually UM UH You Know so UM"
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    fillers = json.loads(analytics.filler_word_counts_json)
    assert fillers["so"] == 2
    assert fillers["basically"] == 1
    assert fillers["like"] == 1
    assert fillers["actually"] == 1
    assert fillers["um"] == 2
    assert fillers["uh"] == 1
    assert fillers["you know"] == 1


def test_filler_matching_avoids_substring_matches(analytics_db):
    """Req 9: Filler matching does not count substrings inside unrelated words."""
    session, lec = analytics_db

    # Words like 'likely', 'dislike', 'alike', 'somebody', 'umbrella', 'unhandled', 'solitude'
    text = "It is likely that we dislike solitude and umbrella solutions in an unhandled manner."
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    fillers = json.loads(analytics.filler_word_counts_json)
    assert fillers["like"] == 0
    assert fillers["so"] == 0
    assert fillers["um"] == 0
    assert fillers["uh"] == 0
    assert fillers["basically"] == 0
    assert fillers["actually"] == 0
    assert fillers["you know"] == 0


def test_glossary_keyword_frequency_works_when_glossary_exists(analytics_db):
    """Req 10: Glossary keyword frequency works when glossary terms exist."""
    session, lec = analytics_db

    g1 = Glossary(lecture_id=lec.id, term="Page Fault", definition="An interrupt when page is not in RAM.")
    g2 = Glossary(lecture_id=lec.id, term="Virtual Memory", definition="Memory management technique.")
    session.add_all([g1, g2])
    session.commit()

    text = "A Page Fault occurs when virtual memory accesses a missing page. Another page fault might occur."
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    keywords = json.loads(analytics.keyword_frequency_json)
    assert keywords["Page Fault"] == 2
    assert keywords["Virtual Memory"] == 1


def test_keyword_frequency_is_empty_dict_when_no_glossary_rows(analytics_db):
    """Req 11: Keyword frequency is exactly an empty object {} when no glossary rows exist."""
    session, lec = analytics_db

    text = "Some random lecture content with technical terms."
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)

    keywords = json.loads(analytics.keyword_frequency_json)
    assert keywords == {}


def test_rerunning_analytics_overwrites_existing_row(analytics_db):
    """Req 12: Re-running analytics for the same lecture updates/overwrites the existing row."""
    session, lec = analytics_db

    timestamps1 = json.dumps([{"start": 0.0, "end": 60.0, "text": "Initial text like um."}])
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text="Initial text like um.",
        corrected_text=None,
        segment_timestamps_json=timestamps1,
        status="completed",
    )
    session.add(transcript)
    session.commit()

    # Initial computation
    analytics1 = compute_and_save_lecture_analytics(session, lec.id)
    initial_id = analytics1.id
    fillers1 = json.loads(analytics1.filler_word_counts_json)
    assert fillers1["like"] == 1

    # Update transcript corrected text with new content
    transcript.corrected_text = "Updated text with basically so actually like like."
    session.commit()

    # Re-run analytics
    analytics2 = compute_and_save_lecture_analytics(session, lec.id)

    # Must overwrite the exact same row (1:1 constraint)
    assert analytics2.id == initial_id
    total_analytics_count = session.query(LectureAnalytics).filter(LectureAnalytics.lecture_id == lec.id).count()
    assert total_analytics_count == 1

    fillers2 = json.loads(analytics2.filler_word_counts_json)
    assert fillers2["like"] == 2
    assert fillers2["basically"] == 1


def test_analytics_computation_does_not_mutate_other_entities(analytics_db):
    """Req 13: Analytics computation does not mutate the transcript or other lecture content."""
    session, lec = analytics_db

    text = "Sample lecture transcript text for safety check."
    timestamps = json.dumps([{"start": 0.0, "end": 30.0, "text": text}])
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text="Corrected text for safety check.",
        segment_timestamps_json=timestamps,
        status="completed",
        error_message=None,
    )
    session.add(transcript)

    glossary = Glossary(lecture_id=lec.id, term="Safety Check", definition="Ensures non-mutation.")
    session.add(glossary)
    session.commit()

    # Capture original attributes
    orig_lec_status = lec.status
    orig_trans_raw = transcript.raw_text
    orig_trans_corrected = transcript.corrected_text
    orig_trans_status = transcript.status
    orig_glossary_term = glossary.term

    # Execute analytics computation
    compute_and_save_lecture_analytics(session, lec.id)

    # Reload from database to verify invariants
    session.refresh(lec)
    session.refresh(transcript)
    session.refresh(glossary)

    assert lec.status == orig_lec_status
    assert transcript.raw_text == orig_trans_raw
    assert transcript.corrected_text == orig_trans_corrected
    assert transcript.status == orig_trans_status
    assert glossary.term == orig_glossary_term


def test_glossary_keyword_cpp_symbol_counted_correctly(analytics_db):
    """Req Correction 1: C++ is counted when the transcript contains C++."""
    session, lec = analytics_db

    g1 = Glossary(lecture_id=lec.id, term="C++", definition="A general-purpose programming language.")
    session.add(g1)
    session.commit()

    text = "In this course we will write code in C++, C++11 features, and learn modern C++."
    # Matches: 'C++' (1st), 'modern C++' (3rd). 'C++11' fails right boundary (?!\w) because of '11'.
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)
    keywords = json.loads(analytics.keyword_frequency_json)
    assert keywords["C++"] == 2


def test_glossary_keyword_csharp_symbol_counted_correctly(analytics_db):
    """Req Correction 2: C# is counted when the transcript contains C#."""
    session, lec = analytics_db

    g1 = Glossary(lecture_id=lec.id, term="C#", definition="A modern object-oriented language by Microsoft.")
    g2 = Glossary(lecture_id=lec.id, term=".NET", definition="A software framework.")
    session.add_all([g1, g2])
    session.commit()

    text = "We are using C# with .NET framework to build applications in C#."
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)
    keywords = json.loads(analytics.keyword_frequency_json)
    assert keywords["C#"] == 2
    assert keywords[".NET"] == 1


def test_glossary_keyword_multiword_term_counted_correctly(analytics_db):
    """Req Correction 3: Ordinary multi-word term such as Page Fault still counts correctly."""
    session, lec = analytics_db

    g1 = Glossary(lecture_id=lec.id, term="Page Fault", definition="An exception raised by hardware.")
    session.add(g1)
    session.commit()

    text = "When a Page Fault occurs, the OS handles the page fault and resumes execution."
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)
    keywords = json.loads(analytics.keyword_frequency_json)
    assert keywords["Page Fault"] == 2


def test_glossary_keyword_avoids_false_substring_in_larger_alphanumeric_words(analytics_db):
    """Req Correction 4: Glossary term does not incorrectly match inside a larger alphanumeric word."""
    session, lec = analytics_db

    g1 = Glossary(lecture_id=lec.id, term="C", definition="The C programming language.")
    g2 = Glossary(lecture_id=lec.id, term="Net", definition="A network concept.")
    session.add_all([g1, g2])
    session.commit()

    # 'Cat', 'CPU', 'Network', 'Internet' should NOT trigger 'C' or 'Net'
    text = "The Cat ran to CPU and connected to the Network on the Internet."
    transcript = Transcript(
        lecture_id=lec.id,
        raw_text=text,
        corrected_text=None,
        segment_timestamps_json=json.dumps([{"start": 0.0, "end": 10.0, "text": text}]),
        status="completed",
    )
    session.add(transcript)
    session.commit()

    analytics = compute_and_save_lecture_analytics(session, lec.id)
    keywords = json.loads(analytics.keyword_frequency_json)
    assert keywords["C"] == 0
    assert keywords["Net"] == 0

