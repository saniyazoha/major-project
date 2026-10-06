from typing import List, Tuple, Optional, Set
from sqlalchemy.orm import Session
from app.models.subject import Subject
from app.models.lecture import Lecture
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.subject_glossary import SubjectGlossary
from app.models.glossary import Glossary
from app.models.concept_edge import ConceptEdge
from app.schemas.graph import KnowledgeGraphResponse, GraphNode, GraphEdge


def get_subject_knowledge_graph(
    db: Session,
    subject_id: int,
    user_id: int,
    role: str,
) -> Tuple[Optional[KnowledgeGraphResponse], Optional[str]]:
    """Retrieve subject knowledge graph (nodes & concept edges) with strict role authorization and broadcast filtering.

    Returns:
        (KnowledgeGraphResponse, None) on success
        (None, error_code) on failure ("SUBJECT_NOT_FOUND", "NOT_SUBJECT_OWNER", "NOT_ENROLLED")
    """
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return None, "SUBJECT_NOT_FOUND"

    # Role Authorization & Filtering
    if role == "faculty":
        if subject.faculty_id != user_id:
            return None, "NOT_SUBJECT_OWNER"
        allowed_lecture_ids = [
            l_id for (l_id,) in db.query(Lecture.id).filter(Lecture.subject_id == subject_id).all()
        ]
    elif role == "student":
        enrolled = (
            db.query(Enrollment)
            .join(Batch, Enrollment.batch_id == Batch.id)
            .filter(Batch.subject_id == subject_id, Enrollment.student_id == user_id)
            .first()
        )
        if not enrolled:
            return None, "NOT_ENROLLED"
        # Student access restricted ONLY to broadcast lectures
        allowed_lecture_ids = [
            l_id
            for (l_id,) in db.query(Lecture.id)
            .filter(Lecture.subject_id == subject_id, Lecture.status == "broadcast")
            .all()
        ]
    else:
        return None, "NOT_ENROLLED"

    if not allowed_lecture_ids:
        return KnowledgeGraphResponse(subject_id=subject_id, nodes=[], edges=[]), None

    # Retrieve candidate concept edges matching allowed lectures
    db_edges = (
        db.query(ConceptEdge)
        .filter(
            ConceptEdge.subject_id == subject_id,
            ConceptEdge.lecture_id.in_(allowed_lecture_ids),
        )
        .all()
    )

    # Retrieve glossary terms (Faculty: subject-level SubjectGlossary; Student: broadcast-lecture Glossary)
    if role == "faculty":
        db_glossary = (
            db.query(SubjectGlossary.term)
            .filter(SubjectGlossary.subject_id == subject_id)
            .all()
        )
    else:
        db_glossary = (
            db.query(Glossary.term)
            .filter(Glossary.lecture_id.in_(allowed_lecture_ids))
            .all()
        )

    # Collect nodes (unique terms)
    node_set: Set[str] = {t for (t,) in db_glossary if t and t.strip()}
    for edge in db_edges:
        if edge.source_term and edge.source_term.strip():
            node_set.add(edge.source_term.strip())
        if edge.target_term and edge.target_term.strip():
            node_set.add(edge.target_term.strip())

    nodes: List[GraphNode] = [GraphNode(id=term, label=term) for term in sorted(list(node_set))]
    edges: List[GraphEdge] = [
        GraphEdge(
            id=e.id,
            source=e.source_term,
            target=e.target_term,
            label=e.relationship_label,
        )
        for e in db_edges
    ]

    return KnowledgeGraphResponse(subject_id=subject_id, nodes=nodes, edges=edges), None
