import pytest
from datetime import date
from unittest.mock import patch, MagicMock
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
from app.models.subject_glossary import SubjectGlossary
from app.models.note_embedding import NoteEmbedding
from app.core import security
from app.services import (
    subject_glossary_service,
    search_service,
    generation_service,
    transcript_processing_service,
)


@pytest.fixture
def p7_setup():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Faculty 1 & 2
    fac1 = Faculty(name="Dr. Turing", username="turing7", password_hash=security.hash_password("Pass123!"))
    fac2 = Faculty(name="Dr. Lovelace", username="lovelace7", password_hash=security.hash_password("Pass123!"))
    # Student 1 & 2
    stu1 = Student(name="Student One", rollno="S701", username="stu701", password_hash=security.hash_password("Pass123!"))
    stu2 = Student(name="Student Two", rollno="S702", username="stu702", password_hash=security.hash_password("Pass123!"))
    session.add_all([fac1, fac2, stu1, stu2])
    session.commit()

    # Subjects
    sub1 = Subject(name="Data Structures", faculty_id=fac1.id)
    sub2 = Subject(name="Algorithms", faculty_id=fac2.id)
    session.add_all([sub1, sub2])
    session.commit()

    # Batches
    b1 = Batch(batchname="CS-2026-A", subject_id=sub1.id)
    b2 = Batch(batchname="CS-2026-B", subject_id=sub2.id)
    session.add_all([b1, b2])
    session.commit()

    # Enrollment: stu1 in sub1 only
    enr1 = Enrollment(student_id=stu1.id, batch_id=b1.id)
    session.add(enr1)
    session.commit()

    # Lectures for sub1
    lec1_bc = Lecture(
        title="Binary Trees",
        subject_id=sub1.id,
        batch_id=b1.id,
        faculty_id=fac1.id,
        original_filename="trees.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/trees.mp4",
        status="broadcast",
    )
    lec2_draft = Lecture(
        title="Graphs Intro",
        subject_id=sub1.id,
        batch_id=b1.id,
        faculty_id=fac1.id,
        original_filename="graphs.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/graphs.mp4",
        status="draft",
    )
    # Lecture for sub2
    lec3_sub2 = Lecture(
        title="Sorting Algorithms",
        subject_id=sub2.id,
        batch_id=b2.id,
        faculty_id=fac2.id,
        original_filename="sorting.mp4",
        file_type="video/mp4",
        file_size=1024,
        storage_path="/path/sorting.mp4",
        status="broadcast",
    )
    session.add_all([lec1_bc, lec2_draft, lec3_sub2])
    session.commit()

    # Tokens
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
        "sub1": sub1,
        "sub2": sub2,
        "b1": b1,
        "b2": b2,
        "lec1_bc": lec1_bc,
        "lec2_draft": lec2_draft,
        "lec3_sub2": lec3_sub2,
        "fac1_token": fac1_token,
        "fac2_token": fac2_token,
        "stu1_token": stu1_token,
        "stu2_token": stu2_token,
    }

    app.dependency_overrides.clear()


# ==================== 7a. AUTO-GLOSSARY TESTS ====================

def test_subject_glossary_deduplication(p7_setup):
    """Verify subject glossary insertion, normalization, whitespace trimming, case-insensitivity, and subject isolation."""
    session = p7_setup["session"]
    sub1 = p7_setup["sub1"]
    sub2 = p7_setup["sub2"]

    # 1. First insertion into sub1
    items1 = [{"term": "Binary Tree", "definition": "Tree where nodes have at most two children"}]
    inserted = subject_glossary_service.upsert_subject_glossary_terms(session, sub1.id, items1)
    session.commit()
    assert len(inserted) == 1
    assert inserted[0].normalized_term == "binary tree"

    # 2. Duplicate normalized terms (case difference, surrounding whitespace) into sub1 -> skipped
    dup_items = [
        {"term": "binary tree", "definition": "Duplicate def 1"},
        {"term": "  BINARY TREE  ", "definition": "Duplicate def 2"},
        {"term": "Binary Tree ", "definition": "Duplicate def 3"},
    ]
    inserted_dups = subject_glossary_service.upsert_subject_glossary_terms(session, sub1.id, dup_items)
    session.commit()
    assert len(inserted_dups) == 0

    # Total in sub1 must remain 1
    sub1_terms = session.query(SubjectGlossary).filter(SubjectGlossary.subject_id == sub1.id).all()
    assert len(sub1_terms) == 1
    assert sub1_terms[0].term == "Binary Tree"

    # 3. Same term in sub2 -> allowed
    inserted_sub2 = subject_glossary_service.upsert_subject_glossary_terms(session, sub2.id, items1)
    session.commit()
    assert len(inserted_sub2) == 1
    assert inserted_sub2[0].subject_id == sub2.id


@patch("app.services.generation_service.call_groq_llm")
def test_3a_generation_populates_subject_glossary(mock_llm, p7_setup):
    """Verify successful 3A generation populates subject_glossary."""
    session = p7_setup["session"]
    lec = p7_setup["lec1_bc"]

    # Change lecture status to 'uploaded' to allow generation
    lec.status = "uploaded"
    session.commit()

    # Create completed transcript
    tr = Transcript(lecture_id=lec.id, raw_text="A binary tree is a hierarchical data structure.", status="completed")
    session.add(tr)
    session.commit()

    # Mock LLM JSON response
    mock_llm.return_value = """{
      "notes_markdown": "Binary tree overview notes.",
      "summary_text": "Binary tree summary.",
      "flashcards": [{"question": "What is binary tree?", "answer": "Tree with max 2 children"}],
      "quizzes": [{"question": "Max children in binary tree?", "options": ["1", "2", "3", "4"], "correct_answer": "2", "explanation": "By definition."}],
      "glossary": [{"term": "Recursion", "definition": "A process in which a function calls itself."}]
    }"""

    updated_lec = generation_service.process_lecture_generation(session, lec.id)
    assert updated_lec.status == "draft"

    # Verify subject_glossary contains "Recursion"
    sg_item = (
        session.query(SubjectGlossary)
        .filter(SubjectGlossary.subject_id == lec.subject_id, SubjectGlossary.normalized_term == "recursion")
        .first()
    )
    assert sg_item is not None
    assert sg_item.term == "Recursion"


@patch("app.services.storage_service.download_lecture_file", return_value=b"fake_audio")
@patch("app.services.audio_chunking_service.chunk_audio_bytes")
@patch("app.services.transcription_service.translate_audio_to_english")
def test_transcription_glossary_prompt_feed(mock_translate, mock_chunk, mock_download, p7_setup):
    """Verify transcription feeds accumulated subject glossary terms into Groq prompt parameter."""
    session = p7_setup["session"]
    sub1 = p7_setup["sub1"]
    lec = p7_setup["lec1_bc"]

    # Mock audio chunking
    mock_chunk.return_value = [{"chunk_index": 0, "file_bytes": b"fake", "filename": "c0.mp3", "start_time": 0.0}]
    mock_translate.return_value = {"text": "Hello world", "segments": []}

    # Case 1: Empty subject glossary -> prompt is None (not passed as kwarg)
    transcript_processing_service.process_lecture_transcription(session, lec.id)
    mock_translate.assert_called_with(
        audio_file=b"fake",
        filename="c0.mp3",
    )

    # Case 2: Populate subject glossary with terms
    sg1 = SubjectGlossary(subject_id=sub1.id, term="Tree", normalized_term="tree", definition="Data structure")
    sg2 = SubjectGlossary(subject_id=sub1.id, term="Node", normalized_term="node", definition="Element in tree")
    session.add_all([sg1, sg2])
    session.commit()

    # Re-run transcription
    transcript_processing_service.process_lecture_transcription(session, lec.id)
    mock_translate.assert_called_with(
        audio_file=b"fake",
        filename="c0.mp3",
        prompt="Glossary terms: Tree, Node",
    )


# ==================== 7b. SEMANTIC SEARCH TESTS ====================

def test_note_embedding_creation_and_similarity_search(p7_setup):
    """Verify embedding creation, query embedding, and cosine similarity sorting."""
    session = p7_setup["session"]
    sub1 = p7_setup["sub1"]
    lec = p7_setup["lec1_bc"]

    chunks = [
        "Binary search trees provide efficient logarithmic O(log n) lookups.",
        "Bubble sort has a quadratic worst-case time complexity of O(n^2).",
    ]
    embeddings = search_service.create_note_embeddings_for_lecture(session, lec.id, sub1.id, chunks)
    session.commit()
    assert len(embeddings) == 2

    # Perform search as faculty (fac1 owns sub1)
    results, error = search_service.search_subject_notes(
        session, subject_id=sub1.id, query="logarithmic tree search", user_id=p7_setup["fac1"].id, role="faculty"
    )
    assert error is None
    assert len(results) == 2
    # Top result should be the binary search tree chunk
    assert "Binary search trees" in results[0].chunk_text
    assert results[0].similarity_score > results[1].similarity_score


def test_semantic_search_authorization_faculty(p7_setup):
    """Verify faculty can search their own subject, but cannot search another faculty's subject."""
    client = p7_setup["client"]
    sub1 = p7_setup["sub1"]
    sub2 = p7_setup["sub2"]
    fac1_token = p7_setup["fac1_token"]

    # 1. Faculty 1 searches own subject (sub1) -> 200 OK
    res1 = client.get(
        f"/subjects/{sub1.id}/search?q=tree",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["subject_id"] == sub1.id
    assert isinstance(d1["results"], list)

    # 2. Faculty 1 attempts to search Faculty 2's subject (sub2) -> 403 Forbidden
    res2 = client.get(
        f"/subjects/{sub2.id}/search?q=sorting",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res2.status_code == 403


def test_semantic_search_authorization_student(p7_setup):
    """Verify student search scoping: enrolled subjects only, broadcast lectures only."""
    client = p7_setup["client"]
    session = p7_setup["session"]
    sub1 = p7_setup["sub1"]
    sub2 = p7_setup["sub2"]
    lec1_bc = p7_setup["lec1_bc"]
    lec2_draft = p7_setup["lec2_draft"]
    stu1_token = p7_setup["stu1_token"]

    # Add note embeddings to both broadcast (lec1) and draft (lec2) lectures
    search_service.create_note_embeddings_for_lecture(
        session, lec1_bc.id, sub1.id, ["Broadcast lecture note content on binary trees."]
    )
    search_service.create_note_embeddings_for_lecture(
        session, lec2_draft.id, sub1.id, ["Draft lecture note content on graph traversal."]
    )
    session.commit()

    # 1. Student 1 searches enrolled subject (sub1) -> receive ONLY broadcast lecture chunks
    res1 = client.get(
        f"/subjects/{sub1.id}/search?q=content",
        headers={"Authorization": f"Bearer {stu1_token}"},
    )
    assert res1.status_code == 200
    d1 = res1.json()
    results = d1["results"]
    assert len(results) == 1
    assert results[0]["lecture_id"] == lec1_bc.id
    assert "Broadcast lecture note" in results[0]["chunk_text"]

    # 2. Student 1 attempts to search unenrolled subject (sub2) -> 403 Forbidden
    res2 = client.get(
        f"/subjects/{sub2.id}/search?q=sorting",
        headers={"Authorization": f"Bearer {stu1_token}"},
    )
    assert res2.status_code == 403


def test_semantic_search_invalid_query_and_auth(p7_setup):
    """Verify unauthenticated access is rejected and empty/whitespace queries return 400 Bad Request."""
    client = p7_setup["client"]
    sub1 = p7_setup["sub1"]
    fac1_token = p7_setup["fac1_token"]

    # 1. Unauthenticated -> 401
    res_unauth = client.get(f"/subjects/{sub1.id}/search?q=tree")
    assert res_unauth.status_code == 401

    # 2. Whitespace/empty query -> 400
    res_empty = client.get(
        f"/subjects/{sub1.id}/search?q=   ",
        headers={"Authorization": f"Bearer {fac1_token}"},
    )
    assert res_empty.status_code == 400
