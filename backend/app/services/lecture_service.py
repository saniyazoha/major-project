from sqlalchemy.orm import Session
from typing import List, Tuple
from app.models.lecture import Lecture
from app.models.batch import Batch
from app.models.subject import Subject
from app.models.enrollment import Enrollment


def create_lecture(
    db: Session,
    title: str,
    batch_id: int,
    faculty_id: int,
    original_filename: str,
    file_type: str,
    file_size: int,
    storage_path: str,
) -> Tuple[Lecture | None, str | None]:
    """Create a new lecture record attached to a batch owned by the faculty."""
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return None, "BATCH_NOT_FOUND"

    subject = db.query(Subject).filter(Subject.id == batch.subject_id).first()
    if not subject or subject.faculty_id != faculty_id:
        return None, "NOT_BATCH_OWNER"

    lecture = Lecture(
        title=title,
        subject_id=subject.id,
        batch_id=batch_id,
        faculty_id=faculty_id,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
        status="uploaded",
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture, None


def get_lectures_for_user(
    db: Session, user_id: int, role: str, batch_id: int | None = None
) -> List[Lecture]:
    """Retrieve lectures accessible to the user based on role and broadcast status."""
    if role == "faculty":
        query = db.query(Lecture).filter(Lecture.faculty_id == user_id)
        if batch_id is not None:
            query = query.filter(Lecture.batch_id == batch_id)
        return query.order_by(Lecture.created_at.desc()).all()
    elif role == "student":
        # Students must only see lectures where enrolled in the batch AND status is "broadcast"
        query = (
            db.query(Lecture)
            .join(Enrollment, Lecture.batch_id == Enrollment.batch_id)
            .filter(
                Enrollment.student_id == user_id,
                Lecture.status == "broadcast"
            )
        )
        if batch_id is not None:
            query = query.filter(Lecture.batch_id == batch_id)
        return query.distinct().order_by(Lecture.created_at.desc()).all()
    return []


def get_lecture_by_id(
    db: Session, lecture_id: int, user_id: int, role: str
) -> Tuple[Lecture | None, str | None]:
    """Retrieve a single lecture by ID if the user has valid access rights."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        return None, "LECTURE_NOT_FOUND"

    if role == "faculty":
        if lecture.faculty_id != user_id:
            return None, "ACCESS_DENIED"
        return lecture, None
    elif role == "student":
        # Enrolled student must be denied access if status is not "broadcast"
        if lecture.status != "broadcast":
            return None, "ACCESS_DENIED"

        enrollment = (
            db.query(Enrollment)
            .filter(Enrollment.batch_id == lecture.batch_id, Enrollment.student_id == user_id)
            .first()
        )
        if not enrollment:
            return None, "ACCESS_DENIED"
        return lecture, None

    return None, "ACCESS_DENIED"
