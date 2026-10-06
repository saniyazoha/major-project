import pytest
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
from app.models.subject_glossary import SubjectGlossary
from app.models.glossary import Glossary
from app.models.concept_edge import ConceptEdge
from app.core import security
from app.services import (
    concept_extraction_service,
    graph_service,
    generation_service,
)


@pytest.fixture
def p8_setup():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()

    # Faculty 1 & 2
    fac1 = Faculty(name="Dr. Turing", username="turing8", password_hash=security.hash_password("Pass123!"))
    fac2 = Faculty(name="Dr. Lovelace", username="lovelace8", password_hash=security.hash_password("Pass123!"))
    # Student 1 & 2
    stu1 = Student(name="Student One", rollno="S801", username="stu801", password_hash=security.hash_password("Pass123!"))
    stu2 = Student(name="Student Two", rollno="S802", username="stu802", password_hash=security.hash_password("Pass123!"))
    session.add_all([fac1, fac2, stu1, stu2])
    session.commit()

    # Subjects
    sub1 = Subject(name="Data Structures", faculty_id=fac1.id)
    sub2 = Subject(name="Algorithms", faculty_id=fac2.id)
    session.add_all([sub1, sub2])
    session.commit()

    # Batches
    b1 = Batch(batchname="CS-2026-A8", subject_id=sub1.id)
    b2 = Batch(batchname="CS-2026-B8", subject_id=sub2.id)
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


# ==================== TESTS ====================

def test_concept_edges_table_and_model(p8_setup):
    """Verify concept_edges model creation and properties."""
    session = p8_setup["session"]
    lec = p8_setup["lec1_bc"]
    sub = p8_setup["sub1"]

    edge = ConceptEdge(
        lecture_id=lec.id,
        subject_id=sub.id,
        source_term="Binary Tree",
        target_term="Node",
        relationship_label="contains",
    )
    session.add(edge)
    session.commit()

    db_edge = session.query(ConceptEdge).filter(ConceptEdge.id == edge.id).first()
    assert db_edge is not None
    assert db_edge.source_term == "Binary Tree"
    assert db_edge.target_term == "Node"
    assert db_edge.relationship_label == "contains"


@patch("app.services.generation_service.call_groq_llm")
def test_concept_extraction_receives_glossary_and_notes(mock_llm, p8_setup):
    """Verify concept extraction receives lecture glossary + notes and populates concept edges."""
    session = p8_setup["session"]
    lec = p8_setup["lec1_bc"]
    sub = p8_setup["sub1"]

    glossary = [{"term": "Tree", "definition": "Hierarchical data structure"}]
    notes = "Binary trees consist of nodes with at most two children."

    mock_llm.return_value = """{
      "concept_edges": [
        {
          "source_term": "Binary Tree",
          "target_term": "Node",
          "relationship_label": "consists of"
        }
      ]
    }"""

    saved_edges = concept_extraction_service.extract_and_save_concept_edges(
        session, lec.id, sub.id, glossary, notes
    )
    session.commit()

    assert len(saved_edges) == 1
    assert saved_edges[0].source_term == "Binary Tree"
    assert saved_edges[0].target_term == "Node"
    assert saved_edges[0].relationship_label == "consists of"

    # Verify mock_llm received both glossary and notes text
    prompt_arg = mock_llm.call_args[0][0]
    assert "Hierarchical data structure" in prompt_arg
    assert "Binary trees consist of nodes" in prompt_arg


@patch("app.services.generation_service.call_groq_llm")
def test_successful_generation_creates_concept_edges_and_handles_repeat_generation(mock_llm, p8_setup):
    """Verify successful 3A generation creates concept edges and repeat generation clears previous edges without uncontrolled duplication."""
    session = p8_setup["session"]
    lec = p8_setup["lec1_bc"]
    lec.status = "uploaded"
    session.commit()

    tr = Transcript(lecture_id=lec.id, raw_text="Trees are non-linear structures.", status="completed")
    session.add(tr)
    session.commit()

    # Mock LLM returns content for segment & concept edges
    mock_llm.return_value = """{
      "notes_markdown": "Tree structures.",
      "summary_text": "Trees summary.",
      "flashcards": [],
      "quizzes": [],
      "glossary": [{"term": "Tree", "definition": "Structure"}],
      "concept_edges": [
        {"source_term": "Tree", "target_term": "Root", "relationship_label": "has"}
      ]
    }"""

    # First generation
    generation_service.process_lecture_generation(session, lec.id)
    edges1 = session.query(ConceptEdge).filter(ConceptEdge.lecture_id == lec.id).all()
    assert len(edges1) == 1
    assert edges1[0].source_term == "Tree"

    # Repeat generation
    lec.status = "uploaded"
    session.commit()
    generation_service.process_lecture_generation(session, lec.id)
    edges2 = session.query(ConceptEdge).filter(ConceptEdge.lecture_id == lec.id).all()
    # Should NOT duplicate edges
    assert len(edges2) == 1


@patch("app.services.generation_service.call_groq_llm", side_effect=Exception("LLM Failure"))
def test_failed_generation_does_not_persist_edges(mock_llm, p8_setup):
    """Verify failed/incomplete generation rolls back and does not persist edges."""
    session = p8_setup["session"]
    lec = p8_setup["lec1_bc"]
    lec.status = "uploaded"
    session.commit()

    tr = Transcript(lecture_id=lec.id, raw_text="Trees structure.", status="completed")
    session.add(tr)
    session.commit()

    with pytest.raises(generation_service.GenerationError):
        generation_service.process_lecture_generation(session, lec.id)

    edges = session.query(ConceptEdge).filter(ConceptEdge.lecture_id == lec.id).all()
    assert len(edges) == 0


def test_graph_endpoint_nodes_and_edges(p8_setup):
    """Verify GET /subjects/{id}/graph returns glossary terms as nodes and concept edges."""
    client = p8_setup["client"]
    session = p8_setup["session"]
    sub1 = p8_setup["sub1"]
    lec = p8_setup["lec1_bc"]
    fac1_token = p8_setup["fac1_token"]

    # Populate glossary & edge
    sg = SubjectGlossary(subject_id=sub1.id, term="Tree", normalized_term="tree", definition="Def")
    ce = ConceptEdge(lecture_id=lec.id, subject_id=sub1.id, source_term="Tree", target_term="Node", relationship_label="contains")
    session.add_all([sg, ce])
    session.commit()

    res = client.get(f"/subjects/{sub1.id}/graph", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res.status_code == 200
    d = res.json()
    assert d["subject_id"] == sub1.id

    node_labels = [n["label"] for n in d["nodes"]]
    assert "Tree" in node_labels
    assert "Node" in node_labels

    edges = d["edges"]
    assert len(edges) == 1
    assert edges[0]["source"] == "Tree"
    assert edges[0]["target"] == "Node"
    assert edges[0]["label"] == "contains"


def test_graph_faculty_authorization(p8_setup):
    """Verify faculty can access their own subject graph, but cannot access another faculty's subject."""
    client = p8_setup["client"]
    sub1 = p8_setup["sub1"]
    sub2 = p8_setup["sub2"]
    fac1_token = p8_setup["fac1_token"]

    # Faculty 1 owns sub1 -> 200 OK
    res1 = client.get(f"/subjects/{sub1.id}/graph", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res1.status_code == 200

    # Faculty 1 tries to access sub2 (owned by fac2) -> 403 Forbidden
    res2 = client.get(f"/subjects/{sub2.id}/graph", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res2.status_code == 403


def test_graph_student_authorization_and_broadcast_filtering(p8_setup):
    """Verify student authorization: enrolled subject accessible, unenrolled forbidden, non-broadcast lecture edges excluded."""
    client = p8_setup["client"]
    session = p8_setup["session"]
    sub1 = p8_setup["sub1"]
    sub2 = p8_setup["sub2"]
    lec1_bc = p8_setup["lec1_bc"]
    lec2_draft = p8_setup["lec2_draft"]
    stu1_token = p8_setup["stu1_token"]

    # Edge in broadcast lecture (lec1)
    ce_bc = ConceptEdge(
        lecture_id=lec1_bc.id,
        subject_id=sub1.id,
        source_term="Broadcast Concept",
        target_term="Public Node",
        relationship_label="links",
    )
    # Edge in draft lecture (lec2)
    ce_draft = ConceptEdge(
        lecture_id=lec2_draft.id,
        subject_id=sub1.id,
        source_term="Draft Concept",
        target_term="Secret Node",
        relationship_label="hidden",
    )
    session.add_all([ce_bc, ce_draft])
    session.commit()

    # 1. Student 1 enrolled in sub1 -> 200 OK
    res1 = client.get(f"/subjects/{sub1.id}/graph", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res1.status_code == 200
    d1 = res1.json()

    # MUST contain broadcast concept edge
    edge_sources = [e["source"] for e in d1["edges"]]
    assert "Broadcast Concept" in edge_sources

    # MUST EXCLUDE draft/non-broadcast concept edge!
    assert "Draft Concept" not in edge_sources

    # 2. Student 1 unenrolled in sub2 -> 403 Forbidden
    res2 = client.get(f"/subjects/{sub2.id}/graph", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res2.status_code == 403


def test_graph_unauthenticated_and_cross_subject_isolation(p8_setup):
    """Verify unauthenticated requests are rejected and cross-subject edges do not leak."""
    client = p8_setup["client"]
    session = p8_setup["session"]
    sub1 = p8_setup["sub1"]
    sub2 = p8_setup["sub2"]
    lec3_sub2 = p8_setup["lec3_sub2"]
    fac2_token = p8_setup["fac2_token"]

    # Add edge to sub2
    ce_sub2 = ConceptEdge(
        lecture_id=lec3_sub2.id,
        subject_id=sub2.id,
        source_term="Algorithm",
        target_term="Sorting",
        relationship_label="includes",
    )
    session.add(ce_sub2)
    session.commit()

    # Unauthenticated -> 401
    res_unauth = client.get(f"/subjects/{sub1.id}/graph")
    assert res_unauth.status_code == 401

    # Faculty 2 accesses sub2 graph -> should not contain sub1 concepts
    res_fac2 = client.get(f"/subjects/{sub2.id}/graph", headers={"Authorization": f"Bearer {fac2_token}"})
    assert res_fac2.status_code == 200
    d = res_fac2.json()
    assert d["subject_id"] == sub2.id
    edge_sources = [e["source"] for e in d["edges"]]
    assert "Algorithm" in edge_sources


def test_student_graph_nodes_exclude_draft_glossary_terms(p8_setup):
    """Verify student graph nodes include terms from broadcast lectures but EXCLUDE terms from draft/non-broadcast lectures, while faculty behavior remains unchanged."""
    client = p8_setup["client"]
    session = p8_setup["session"]
    sub1 = p8_setup["sub1"]
    lec1_bc = p8_setup["lec1_bc"]
    lec2_draft = p8_setup["lec2_draft"]
    stu1_token = p8_setup["stu1_token"]
    fac1_token = p8_setup["fac1_token"]

    # 1. Per-lecture Glossary entries
    g_bc = Glossary(lecture_id=lec1_bc.id, term="BroadcastGlossaryTerm", definition="Def broadcast")
    g_draft = Glossary(lecture_id=lec2_draft.id, term="DraftGlossaryTerm", definition="Def draft")

    # 2. Accumulated SubjectGlossary (contains draft term too)
    sg_draft = SubjectGlossary(subject_id=sub1.id, term="DraftGlossaryTerm", normalized_term="draftglossaryterm", definition="Def draft")

    session.add_all([g_bc, g_draft, sg_draft])
    session.commit()

    # Student request
    res_stu = client.get(f"/subjects/{sub1.id}/graph", headers={"Authorization": f"Bearer {stu1_token}"})
    assert res_stu.status_code == 200
    stu_nodes = [n["label"] for n in res_stu.json()["nodes"]]

    # Student MUST see broadcast lecture term
    assert "BroadcastGlossaryTerm" in stu_nodes
    # Student MUST NOT see draft lecture glossary term!
    assert "DraftGlossaryTerm" not in stu_nodes

    # Faculty request
    res_fac = client.get(f"/subjects/{sub1.id}/graph", headers={"Authorization": f"Bearer {fac1_token}"})
    assert res_fac.status_code == 200
    fac_nodes = [n["label"] for n in res_fac.json()["nodes"]]

    # Faculty sees full subject-level graph including SubjectGlossary terms
    assert "DraftGlossaryTerm" in fac_nodes
