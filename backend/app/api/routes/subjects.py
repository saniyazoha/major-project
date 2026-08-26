from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.dependencies import get_current_user, require_faculty
from app.schemas.academic import (
    SubjectCreate,
    SubjectResponse,
    BatchCreate,
    BatchResponse,
)
from app.services import academic_service

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Create a new subject owned by the authenticated faculty."""
    subject = academic_service.create_subject(
        db, name=payload.name, faculty_id=current_faculty["user_id"]
    )
    return subject


@router.get("", response_model=List[SubjectResponse], status_code=status.HTTP_200_OK)
def get_subjects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve subjects accessible to the authenticated user."""
    return academic_service.get_subjects_for_user(
        db, user_id=current_user["user_id"], role=current_user["role"]
    )


@router.post("/{subject_id}/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch_under_subject(
    subject_id: int,
    payload: BatchCreate,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Create a batch under a subject owned by the authenticated faculty."""
    batch, error = academic_service.create_batch_for_subject(
        db,
        subject_id=subject_id,
        batchname=payload.batchname,
        faculty_id=current_faculty["user_id"],
    )
    if error == "SUBJECT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
        )
    if error == "NOT_SUBJECT_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this subject"
        )
    return batch


@router.get("/{subject_id}/batches", response_model=List[BatchResponse], status_code=status.HTTP_200_OK)
def get_batches_under_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve batches for a subject based on user access rights."""
    batches, error = academic_service.get_batches_for_subject(
        db,
        subject_id=subject_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "SUBJECT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
        )
    if error == "NOT_SUBJECT_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this subject"
        )
    return batches
