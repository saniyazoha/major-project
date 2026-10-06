import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.subject import Subject
from app.models.lecture import Lecture
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.note_embedding import NoteEmbedding
from app.schemas.search import SearchResultItem
from app.services import embedding_service


def cosine_similarity(a_vec: List[float], b_vec: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    a = np.array(a_vec, dtype=float)
    b = np.array(b_vec, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def create_note_embeddings_for_lecture(
    db: Session, lecture_id: int, subject_id: int, text_chunks: List[str]
) -> List[NoteEmbedding]:
    """Generate 384-dimensional embeddings for note text chunks and persist NoteEmbedding records."""
    valid_chunks = [c.strip() for c in text_chunks if c and c.strip()]
    if not valid_chunks:
        return []

    embeddings = embedding_service.generate_embeddings(valid_chunks)
    records: List[NoteEmbedding] = []

    for chunk_text, emb_vec in zip(valid_chunks, embeddings):
        record = NoteEmbedding(
            lecture_id=lecture_id,
            subject_id=subject_id,
            chunk_text=chunk_text,
            embedding=emb_vec,
        )
        db.add(record)
        records.append(record)

    return records


def search_subject_notes(
    db: Session,
    subject_id: int,
    query: str,
    user_id: int,
    role: str,
) -> Tuple[Optional[List[SearchResultItem]], Optional[str]]:
    """Perform subject-scoped semantic search over note embeddings with strict role authorization.

    Returns:
        (results, None) on success
        (None, error_code) on failure ("SUBJECT_NOT_FOUND", "NOT_SUBJECT_OWNER", "NOT_ENROLLED")
    """
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return None, "SUBJECT_NOT_FOUND"

    # Authorization Check
    if role == "faculty":
        if subject.faculty_id != user_id:
            return None, "NOT_SUBJECT_OWNER"
        allowed_lecture_ids = [
            lec_id for (lec_id,) in db.query(Lecture.id).filter(Lecture.subject_id == subject_id).all()
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
        # Students can search ONLY broadcast lectures
        allowed_lecture_ids = [
            lec_id
            for (lec_id,) in db.query(Lecture.id)
            .filter(Lecture.subject_id == subject_id, Lecture.status == "broadcast")
            .all()
        ]
    else:
        return None, "NOT_ENROLLED"

    if not allowed_lecture_ids:
        return [], None

    # Fetch candidate embeddings scoped to subject and allowed lectures
    candidate_records = (
        db.query(NoteEmbedding, Lecture.title.label("lecture_title"))
        .join(Lecture, NoteEmbedding.lecture_id == Lecture.id)
        .filter(
            NoteEmbedding.subject_id == subject_id,
            NoteEmbedding.lecture_id.in_(allowed_lecture_ids),
        )
        .all()
    )

    if not candidate_records:
        return [], None

    # Generate query embedding
    query_vec = embedding_service.generate_query_embedding(query.strip())

    scored_results: List[SearchResultItem] = []
    for record, lec_title in candidate_records:
        score = cosine_similarity(query_vec, record.embedding)
        scored_results.append(
            SearchResultItem(
                id=record.id,
                lecture_id=record.lecture_id,
                lecture_title=lec_title,
                subject_id=record.subject_id,
                chunk_text=record.chunk_text,
                similarity_score=round(score, 4),
            )
        )

    # Sort descending by similarity score
    scored_results.sort(key=lambda item: item.similarity_score, reverse=True)
    return scored_results, None
