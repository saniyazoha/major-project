from sqlalchemy.orm import Session
from typing import List, Tuple
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.student import Student


def create_subject(db: Session, name: str, faculty_id: int) -> Subject:
    """Create a new subject owned by the authenticated faculty."""
    subject = Subject(name=name, faculty_id=faculty_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def get_subjects_for_user(db: Session, user_id: int, role: str) -> List[Subject]:
    """Retrieve subjects accessible to the user based on role."""
    if role == "faculty":
        return db.query(Subject).filter(Subject.faculty_id == user_id).all()
    elif role == "student":
        return (
            db.query(Subject)
            .join(Batch, Subject.id == Batch.subject_id)
            .join(Enrollment, Batch.id == Enrollment.batch_id)
            .filter(Enrollment.student_id == user_id)
            .distinct()
            .all()
        )
    return []


def create_batch_for_subject(
    db: Session, subject_id: int, batchname: str, faculty_id: int
) -> Tuple[Batch | None, str | None]:
    """Create a new batch under a subject if owned by the faculty."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return None, "SUBJECT_NOT_FOUND"
    if subject.faculty_id != faculty_id:
        return None, "NOT_SUBJECT_OWNER"

    batch = Batch(subject_id=subject_id, batchname=batchname)
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch, None


def get_batches_for_subject(
    db: Session, subject_id: int, user_id: int, role: str
) -> Tuple[List[Batch] | None, str | None]:
    """Retrieve batches for a subject based on user role and access rights."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return None, "SUBJECT_NOT_FOUND"

    if role == "faculty":
        if subject.faculty_id != user_id:
            return None, "NOT_SUBJECT_OWNER"
        batches = db.query(Batch).filter(Batch.subject_id == subject_id).all()
        return batches, None
    elif role == "student":
        batches = (
            db.query(Batch)
            .join(Enrollment, Batch.id == Enrollment.batch_id)
            .filter(Batch.subject_id == subject_id, Enrollment.student_id == user_id)
            .all()
        )
        return batches, None

    return [], None


def enroll_student_in_batch(
    db: Session, batch_id: int, student_id: int, faculty_id: int
) -> Tuple[Enrollment | None, str | None]:
    """Enroll a student into a batch belonging to a subject owned by the faculty."""
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return None, "BATCH_NOT_FOUND"

    subject = db.query(Subject).filter(Subject.id == batch.subject_id).first()
    if not subject or subject.faculty_id != faculty_id:
        return None, "NOT_BATCH_OWNER"

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None, "STUDENT_NOT_FOUND"

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.batch_id == batch_id, Enrollment.student_id == student_id)
        .first()
    )
    if existing:
        return None, "ALREADY_ENROLLED"

    enrollment = Enrollment(student_id=student_id, batch_id=batch_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment, None


def get_students_in_batch(
    db: Session, batch_id: int, faculty_id: int
) -> Tuple[List[Student] | None, str | None]:
    """Retrieve enrolled students for a batch belonging to a subject owned by the faculty."""
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return None, "BATCH_NOT_FOUND"

    subject = db.query(Subject).filter(Subject.id == batch.subject_id).first()
    if not subject or subject.faculty_id != faculty_id:
        return None, "NOT_BATCH_OWNER"

    students = (
        db.query(Student)
        .join(Enrollment, Student.id == Enrollment.student_id)
        .filter(Enrollment.batch_id == batch_id)
        .all()
    )
    return students, None
