from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user, require_faculty, require_student
from app.schemas.doubt import DoubtCreate, DoubtAnswer, DoubtResponse
from app.services import doubt_service

router = APIRouter(tags=["doubts"])


@router.post("/lectures/{lecture_id}/doubts", response_model=DoubtResponse, status_code=status.HTTP_201_CREATED)
def create_doubt_for_lecture(
    lecture_id: int,
    payload: DoubtCreate,
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Student submit a question / doubt for a broadcast lecture they are enrolled in."""
    doubt, error = doubt_service.create_doubt(
        db,
        lecture_id=lecture_id,
        student_id=current_student["user_id"],
        question=payload.question,
    )
    if error == "INVALID_QUESTION":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question text cannot be empty",
        )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found",
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this lecture",
        )

    return doubt_service.build_doubt_response_dict(doubt)


@router.get("/lectures/{lecture_id}/doubts", response_model=List[DoubtResponse], status_code=status.HTTP_200_OK)
def get_doubts_for_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve doubts for a lecture (Student: own doubts only; Faculty: all doubts for owned lecture)."""
    doubts, error = doubt_service.get_doubts_for_lecture(
        db,
        lecture_id=lecture_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found",
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this lecture",
        )

    return [doubt_service.build_doubt_response_dict(d) for d in doubts]


@router.get("/doubts/{doubt_id}", response_model=DoubtResponse, status_code=status.HTTP_200_OK)
def get_doubt_by_id(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a single doubt by ID enforcing lecture access and student ownership."""
    doubt, error = doubt_service.get_doubt_by_id(
        db,
        doubt_id=doubt_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "DOUBT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doubt not found",
        )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found",
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this doubt",
        )

    return doubt_service.build_doubt_response_dict(doubt)


@router.patch("/doubts/{doubt_id}/answer", response_model=DoubtResponse, status_code=status.HTTP_200_OK)
def answer_doubt(
    doubt_id: int,
    payload: DoubtAnswer,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty answer a doubt on a lecture they own."""
    doubt, error = doubt_service.answer_doubt(
        db,
        doubt_id=doubt_id,
        faculty_id=current_faculty["user_id"],
        answer_text=payload.answer,
    )
    if error == "INVALID_ANSWER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer text cannot be empty",
        )
    if error == "DOUBT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doubt not found",
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own the lecture associated with this doubt",
        )

    return doubt_service.build_doubt_response_dict(doubt)
