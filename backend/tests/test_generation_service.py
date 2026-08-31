import json
import pytest
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
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.glossary import Glossary
from app.services import generation_service
from app.services.generation_service import (
    GenerationError,
    GenerationParseError,
    select_source_text,
    segment_transcript_into_topics,
    build_topic_segment_prompt,
    parse_and_validate_generation_json,
    process_lecture_generation,
)


@pytest.fixture
def generation_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    fac = Faculty(name="Dr. Alan Turing", username="turing", password_hash="pass123")
    session.add(fac)
    session.commit()

    sub = Subject(name="Operating Systems", faculty_id=fac.id)
    session.add(sub)
    session.commit()

    batch = Batch(subject_id=sub.id, batchname="Section-A")
    session.add(batch)
    session.commit()

    lec = Lecture(
        title="CPU Scheduling Algorithms",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="cpu_scheduling.mp3",
        file_type="audio/mpeg",
        file_size=1024,
        storage_path="lectures/cpu_scheduling.mp3",
        status="uploaded",
        generation_error_message="Previous error message"
    )
    session.add(lec)
    session.commit()

    yield {"session": session, "lecture": lec, "faculty": fac}

    session.close()
    Base.metadata.drop_all(bind=engine)


def test_select_source_text_corrected_text_wins_when_not_none():
    """Verify corrected_text is selected whenever it is not None, regardless of truthiness or content."""
    assert select_source_text("Faculty edited transcript", "Raw ASR transcript") == "Faculty edited transcript"
    assert select_source_text("", "Raw ASR transcript") == ""


def test_select_source_text_falls_back_to_raw_text_when_corrected_is_none():
    """Verify raw_text is selected if and only if corrected_text is None."""
    assert select_source_text(None, "Raw ASR transcript") == "Raw ASR transcript"
    assert select_source_text(None, None) is None


def test_segment_transcript_empty_or_whitespace():
    """Verify segmentation handles None, empty string, and whitespace-only text safely."""
    assert segment_transcript_into_topics(None) == []
    assert segment_transcript_into_topics("") == []
    assert segment_transcript_into_topics("    \n\n   \t  ") == []


def test_segment_transcript_produces_no_empty_segments():
    """Verify segmentation never produces empty or whitespace-only segment entries."""
    sample = "Paragraph 1: Introduction to Operating Systems.\n\n\n\nParagraph 2: Process Scheduling and Threads."
    segments = segment_transcript_into_topics(sample)

    assert len(segments) > 0
    for seg in segments:
        assert "text" in seg
        assert seg["text"].strip() != ""
        assert seg["char_count"] > 0


def test_segment_transcript_preserves_original_text_content():
    """Verify original text content is preserved through segmentation without content modification or loss."""
    text1 = "Process scheduling is a fundamental concept in modern operating systems."
    text2 = "Preemptive scheduling allows high priority tasks to interrupt running tasks."
    full_text = f"{text1}\n\n{text2}"

    segments = segment_transcript_into_topics(full_text)
    combined = "\n\n".join([s["text"] for s in segments])

    assert text1 in combined
    assert text2 in combined
    assert len(segments) == 1


def test_segment_transcript_splits_large_text_into_multiple_segments():
    """Verify larger text exceeding max_segment_chars splits cleanly into ordered segments."""
    para1 = "Para1 " * 300
    para2 = "Para2 " * 300
    para3 = "Para3 " * 300
    full_text = f"{para1}\n\n{para2}\n\n{para3}"

    segments = segment_transcript_into_topics(full_text, max_segment_chars=2500)
    assert len(segments) >= 2
    for i, seg in enumerate(segments):
        assert seg["segment_index"] == i
        assert len(seg["text"]) <= 3600


def test_build_topic_segment_prompt_anti_hallucination_and_placeholder():
    """Verify prompt explicitly contains anti-hallucination rules and placeholder sentinel instructions."""
    prompt = build_topic_segment_prompt("Sample segment text about cpu registers.", segment_index=0, total_segments=1)

    assert "MANDATORY INSTRUCTIONS & ANTI-HALLUCINATION RULES:" in prompt
    assert "Use ONLY information directly supported by the supplied transcript segment" in prompt
    assert "Do NOT invent facts" in prompt
    assert "placeholder/sentinel" in prompt


def test_build_topic_segment_prompt_requests_all_four_content_types():
    """Verify prompt requests notes, summary, flashcards, quizzes, and glossary in one structured response."""
    prompt = build_topic_segment_prompt("Sample segment text.", segment_index=0, total_segments=1)

    assert "notes_markdown" in prompt
    assert "summary_text" in prompt
    assert "flashcards" in prompt
    assert "quizzes" in prompt
    assert "glossary" in prompt


def test_parse_and_validate_generation_json_valid_success():
    """Verify valid JSON matching expected schema parses successfully."""
    valid_json = json.dumps({
        "notes_markdown": "# CPU Registers\n- AX, BX, CX, DX",
        "summary_text": "Overview of general purpose x86 registers.",
        "flashcards": [
            {"question": "What is the accumulator register?", "answer": "AX register"}
        ],
        "quizzes": [
            {
                "question": "Which register is the accumulator?",
                "options": ["AX", "BX", "CX", "DX"],
                "correct_answer": "AX",
                "explanation": "AX is traditionally the primary accumulator."
            }
        ],
        "glossary": [
            {"term": "Register", "definition": "Small, fast storage location inside the CPU."}
        ]
    })

    result = parse_and_validate_generation_json(valid_json)
    assert result["notes_markdown"].startswith("# CPU Registers")
    assert len(result["flashcards"]) == 1
    assert len(result["quizzes"]) == 1
    assert len(result["glossary"]) == 1


def test_parse_and_validate_generation_json_handles_markdown_code_fences():
    """Verify markdown code block fences (e.g. ```json ... ```) are stripped before parsing."""
    raw_response = """```json
{
  "notes_markdown": "# Notes",
  "summary_text": "Summary",
  "flashcards": [],
  "quizzes": [],
  "glossary": []
}
```"""
    result = parse_and_validate_generation_json(raw_response)
    assert result["notes_markdown"] == "# Notes"


def test_parse_and_validate_generation_json_malformed_rejected():
    """Verify malformed JSON or missing required fields raise GenerationParseError."""
    with pytest.raises(GenerationParseError, match="Malformed JSON response"):
        parse_and_validate_generation_json("Invalid { JSON syntax }")

    with pytest.raises(GenerationParseError, match="empty or whitespace"):
        parse_and_validate_generation_json("    ")

    incomplete = json.dumps({
        "notes_markdown": "# Notes",
        "summary_text": "Summary",
        "flashcards": [],
        "quizzes": []
    })
    with pytest.raises(GenerationParseError, match="missing required keys"):
        parse_and_validate_generation_json(incomplete)

    bad_card = json.dumps({
        "notes_markdown": "# Notes",
        "summary_text": "Summary",
        "flashcards": [{"question": "Only question"}],
        "quizzes": [],
        "glossary": []
    })
    with pytest.raises(GenerationParseError, match="must be an object with 'question' and 'answer'"):
        parse_and_validate_generation_json(bad_card)


# =====================================================================
# Sub-Unit 3A.3 Orchestration & Atomic Persistence Unit Tests
# =====================================================================

def test_successful_multi_segment_generation_and_state_transitions(generation_db, monkeypatch):
    """Verify multi-segment generation populates all 4 content types, sets status=draft, and clears error message."""
    session = generation_db["session"]
    lec = generation_db["lecture"]

    # Seed completed transcript with corrected_text large enough to form 2 segments (>2500 chars each)
    sample_timestamps = json.dumps([{"id": 0, "start": 0.0, "end": 5.0, "text": "Raw text"}])
    para1 = "First paragraph about Round Robin scheduling algorithm. " * 100
    para2 = "Second paragraph about Shortest Job First scheduling algorithm. " * 100
    t = Transcript(
        lecture_id=lec.id,
        raw_text="Raw transcript text.",
        corrected_text=f"{para1}\n\n{para2}",
        segment_timestamps_json=sample_timestamps,
        status="completed"
    )
    session.add(t)
    session.commit()

    call_counter = {"count": 0}

    def mock_llm_call(prompt: str) -> str:
        call_counter["count"] += 1
        return json.dumps({
            "notes_markdown": f"# Notes for segment {call_counter['count']}",
            "summary_text": f"Summary for segment {call_counter['count']}",
            "flashcards": [{"question": f"Q{call_counter['count']}", "answer": f"A{call_counter['count']}"}],
            "quizzes": [{
                "question": f"Quiz Q{call_counter['count']}",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": f"Exp {call_counter['count']}"
            }],
            "glossary": [{"term": f"Term{call_counter['count']}", "definition": f"Def{call_counter['count']}"}]
        })

    monkeypatch.setattr(generation_service, "call_groq_llm", mock_llm_call)

    updated_lec = process_lecture_generation(session, lec.id, max_retries=2, backoff_seconds=0.0)

    assert updated_lec.status == "draft"
    assert updated_lec.generation_error_message is None
    assert call_counter["count"] >= 2

    notes = session.query(Note).filter(Note.lecture_id == lec.id).all()
    assert len(notes) == 1
    assert "Notes for segment 1" in notes[0].markdown_content
    assert "Summary for segment 1" in notes[0].summary_text

    flashcards = session.query(Flashcard).filter(Flashcard.lecture_id == lec.id).all()
    assert len(flashcards) >= 2

    quizzes = session.query(Quiz).filter(Quiz.lecture_id == lec.id).all()
    assert len(quizzes) >= 2
    assert quizzes[0].options_json == '["A", "B", "C", "D"]'

    glossary = session.query(Glossary).filter(Glossary.lecture_id == lec.id).all()
    assert len(glossary) >= 2

    session.refresh(t)
    assert t.status == "completed"
    assert t.corrected_text == f"{para1}\n\n{para2}"
    assert t.raw_text == "Raw transcript text."
    assert t.segment_timestamps_json == sample_timestamps


def test_generation_uses_raw_text_when_corrected_text_is_none(generation_db, monkeypatch):
    """Verify raw_text is used as source text when corrected_text is None."""
    session = generation_db["session"]
    lec = generation_db["lecture"]

    t = Transcript(
        lecture_id=lec.id,
        raw_text="Raw ASR transcript used for generation.",
        corrected_text=None,
        status="completed"
    )
    session.add(t)
    session.commit()

    captured_prompts = []

    def mock_llm_call(prompt: str) -> str:
        captured_prompts.append(prompt)
        return json.dumps({
            "notes_markdown": "# Notes from raw text",
            "summary_text": "Summary",
            "flashcards": [],
            "quizzes": [],
            "glossary": []
        })

    monkeypatch.setattr(generation_service, "call_groq_llm", mock_llm_call)

    updated_lec = process_lecture_generation(session, lec.id, max_retries=1, backoff_seconds=0.0)

    assert updated_lec.status == "draft"
    assert len(captured_prompts) == 1
    assert "Raw ASR transcript used for generation." in captured_prompts[0]


def test_malformed_json_triggers_retry_path_and_succeeds(generation_db, monkeypatch):
    """Verify malformed JSON triggers retry loop and succeeds if subsequent attempt returns valid JSON."""
    session = generation_db["session"]
    lec = generation_db["lecture"]

    t = Transcript(
        lecture_id=lec.id,
        raw_text="Transcript text for retry test.",
        status="completed"
    )
    session.add(t)
    session.commit()

    attempts = {"count": 0}

    def mock_llm_call_with_retry(prompt: str) -> str:
        attempts["count"] += 1
        if attempts["count"] == 1:
            return "Malformed { JSON string"
        return json.dumps({
            "notes_markdown": "# Notes after retry",
            "summary_text": "Summary after retry",
            "flashcards": [],
            "quizzes": [],
            "glossary": []
        })

    monkeypatch.setattr(generation_service, "call_groq_llm", mock_llm_call_with_retry)

    updated_lec = process_lecture_generation(session, lec.id, max_retries=3, backoff_seconds=0.0)

    assert attempts["count"] == 2
    assert updated_lec.status == "draft"
    assert session.query(Note).filter(Note.lecture_id == lec.id).first().markdown_content == "# Notes after retry"


def test_segment_failure_exhausts_retries_results_in_zero_rows_and_generation_failed(generation_db, monkeypatch):
    """Verify that if any segment permanently fails after retries, 0 rows are persisted and status=generation_failed."""
    session = generation_db["session"]
    lec = generation_db["lecture"]

    t = Transcript(
        lecture_id=lec.id,
        raw_text="Paragraph 1 text.\n\nParagraph 2 text.",
        status="completed"
    )
    session.add(t)
    session.commit()

    attempts = {"count": 0}

    def mock_llm_failing_call(prompt: str) -> str:
        attempts["count"] += 1
        raise RuntimeError("Groq rate limit exceeded 429")

    monkeypatch.setattr(generation_service, "call_groq_llm", mock_llm_failing_call)

    with pytest.raises(GenerationError, match="Generation orchestration failed"):
        process_lecture_generation(session, lec.id, max_retries=2, backoff_seconds=0.0)

    session.refresh(lec)
    assert lec.status == "generation_failed"
    assert "Groq rate limit exceeded 429" in lec.generation_error_message

    assert session.query(Note).filter(Note.lecture_id == lec.id).count() == 0
    assert session.query(Flashcard).filter(Flashcard.lecture_id == lec.id).count() == 0
    assert session.query(Quiz).filter(Quiz.lecture_id == lec.id).count() == 0
    assert session.query(Glossary).filter(Glossary.lecture_id == lec.id).count() == 0

    session.refresh(t)
    assert t.status == "completed"
    assert t.raw_text == "Paragraph 1 text.\n\nParagraph 2 text."


def test_generation_blocked_when_lecture_status_is_draft_or_broadcast(generation_db, monkeypatch):
    """Verify generation is rejected and existing rows remain untouched when Lecture.status is 'draft' or 'broadcast'."""
    session = generation_db["session"]
    lec = generation_db["lecture"]

    t = Transcript(
        lecture_id=lec.id,
        raw_text="Existing completed transcript.",
        status="completed"
    )
    session.add(t)
    session.commit()

    # Seed existing generated content and set status = draft
    lec.status = "draft"
    note = Note(lecture_id=lec.id, markdown_content="# Existing Notes", summary_text="Existing Summary")
    card = Flashcard(lecture_id=lec.id, question="Existing Q?", answer="Existing A")
    quiz = Quiz(lecture_id=lec.id, question="Existing Quiz?", options_json='["A","B"]', correct_answer="A")
    item = Glossary(lecture_id=lec.id, term="Existing Term", definition="Existing Def")
    session.add_all([note, card, quiz, item])
    session.commit()

    mock_llm = MagicMock()
    monkeypatch.setattr(generation_service, "call_groq_llm", mock_llm)

    # 1. Attempt generation while status is 'draft'
    with pytest.raises(GenerationError, match="status 'draft'"):
        process_lecture_generation(session, lec.id)

    # Assert LLM was NEVER called
    mock_llm.assert_not_called()

    # Assert all existing generated content rows remain 100% untouched
    session.refresh(lec)
    assert lec.status == "draft"
    assert session.query(Note).filter(Note.lecture_id == lec.id).first().markdown_content == "# Existing Notes"
    assert session.query(Flashcard).filter(Flashcard.lecture_id == lec.id).count() == 1
    assert session.query(Quiz).filter(Quiz.lecture_id == lec.id).count() == 1
    assert session.query(Glossary).filter(Glossary.lecture_id == lec.id).count() == 1

    # 2. Attempt generation while status is 'broadcast'
    lec.status = "broadcast"
    session.commit()

    with pytest.raises(GenerationError, match="status 'broadcast'"):
        process_lecture_generation(session, lec.id)

    mock_llm.assert_not_called()
    session.refresh(lec)
    assert lec.status == "broadcast"
    assert session.query(Note).filter(Note.lecture_id == lec.id).first().markdown_content == "# Existing Notes"
    assert session.query(Flashcard).filter(Flashcard.lecture_id == lec.id).count() == 1
