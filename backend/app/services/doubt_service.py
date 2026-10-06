from datetime import datetime, timezone
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.doubt import Doubt
from app.services import lecture_service


def build_doubt_response_dict(doubt: Doubt) -> dict:
    """Helper to convert a Doubt model instance into a response dictionary with student info."""
    return {
        "id": doubt.id,
        "subject_id": doubt.subject_id,
        "lecture_id": doubt.lecture_id,
        "student_id": doubt.student_id,
        "question": doubt.question,
        "status": doubt.status,
        "answer": doubt.answer,
        "answered_by": doubt.answered_by,
        "answered_at": doubt.answered_at,
        "created_at": doubt.created_at,
        "student_name": doubt.student.name if doubt.student else None,
        "student_rollno": doubt.student.rollno if doubt.student else None,
    }


def create_doubt(
    db: Session,
    lecture_id: int,
    student_id: int,
    question: str,
) -> Tuple[Optional[Doubt], Optional[str]]:
    """Create a new doubt for a broadcast lecture accessible to the student."""
    if not question or not question.strip():
        return None, "INVALID_QUESTION"

    # Enforce student lecture access rules (broadcast + enrolled)
    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=lecture_id, user_id=student_id, role="student"
    )
    if error:
        return None, error

    doubt = Doubt(
        subject_id=lecture.subject_id,
        lecture_id=lecture.id,
        student_id=student_id,
        question=question.strip(),
        status="pending",
    )
    db.add(doubt)
    db.commit()
    db.refresh(doubt)
    return doubt, None


def get_doubts_for_lecture(
    db: Session,
    lecture_id: int,
    user_id: int,
    role: str,
) -> Tuple[List[Doubt], Optional[str]]:
    """Retrieve doubts for a lecture enforcing role-based access rules."""
    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=lecture_id, user_id=user_id, role=role
    )
    if error:
        return [], error

    query = db.query(Doubt).options(joinedload(Doubt.student)).filter(Doubt.lecture_id == lecture_id)

    if role == "student":
        # Students MUST ONLY see their own doubts for this lecture
        query = query.filter(Doubt.student_id == user_id)
    elif role == "faculty":
        # Faculty sees all doubts for their owned lecture
        pass

    doubts = query.order_by(Doubt.created_at.asc()).all()
    return doubts, None


def get_doubt_by_id(
    db: Session,
    doubt_id: int,
    user_id: int,
    role: str,
) -> Tuple[Optional[Doubt], Optional[str]]:
    """Retrieve a single doubt by ID enforcing strict role ownership rules."""
    doubt = (
        db.query(Doubt)
        .options(joinedload(Doubt.student))
        .filter(Doubt.id == doubt_id)
        .first()
    )
    if not doubt:
        return None, "DOUBT_NOT_FOUND"

    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=doubt.lecture_id, user_id=user_id, role=role
    )
    if error:
        return None, error

    if role == "student":
        # Student must own the requested doubt
        if doubt.student_id != user_id:
            return None, "ACCESS_DENIED"
    elif role == "faculty":
        # Faculty must own the lecture associated with the doubt
        pass

    return doubt, None


def answer_doubt(
    db: Session,
    doubt_id: int,
    faculty_id: int,
    answer_text: str,
) -> Tuple[Optional[Doubt], Optional[str]]:
    """Faculty answer a doubt on their owned lecture."""
    if not answer_text or not answer_text.strip():
        return None, "INVALID_ANSWER"

    doubt = (
        db.query(Doubt)
        .options(joinedload(Doubt.student))
        .filter(Doubt.id == doubt_id)
        .first()
    )
    if not doubt:
        return None, "DOUBT_NOT_FOUND"

    # Verify faculty owns the lecture
    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=doubt.lecture_id, user_id=faculty_id, role="faculty"
    )
    if error:
        return None, "ACCESS_DENIED"

    doubt.answer = answer_text.strip()
    doubt.answered_by = faculty_id
    doubt.answered_at = datetime.now(timezone.utc)
    doubt.status = "answered"

    db.commit()
    db.refresh(doubt)
    return doubt, None
