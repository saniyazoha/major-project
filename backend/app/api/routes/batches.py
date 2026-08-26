from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.dependencies import require_faculty
from app.schemas.academic import (
    EnrollmentCreate,
    EnrollmentResponse,
    StudentResponse,
)
from app.services import academic_service

router = APIRouter(prefix="/batches", tags=["batches"])


@router.post("/{batch_id}/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_student(
    batch_id: int,
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Enroll a student into a batch belonging to a subject owned by the faculty."""
    enrollment, error = academic_service.enroll_student_in_batch(
        db,
        batch_id=batch_id,
        student_id=payload.student_id,
        faculty_id=current_faculty["user_id"],
    )
    if error == "BATCH_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )
    if error == "NOT_BATCH_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not own the subject for this batch"
        )
    if error == "STUDENT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )
    if error == "ALREADY_ENROLLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Student is already enrolled in this batch"
        )
    return enrollment


@router.get("/{batch_id}/students", response_model=List[StudentResponse], status_code=status.HTTP_200_OK)
def get_students_in_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Retrieve enrolled students for a batch belonging to a subject owned by the faculty."""
    students, error = academic_service.get_students_in_batch(
        db, batch_id=batch_id, faculty_id=current_faculty["user_id"]
    )
    if error == "BATCH_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )
    if error == "NOT_BATCH_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not own the subject for this batch"
        )
    return students
