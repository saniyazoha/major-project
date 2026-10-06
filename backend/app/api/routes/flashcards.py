from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import require_student
from app.models.flashcard import Flashcard
from app.schemas.flashcard_progress import (
    FlashcardReviewRequest,
    FlashcardProgressResponse,
)
from app.services import lecture_service, flashcard_service

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.post(
    "/{flashcard_id}/review",
    response_model=FlashcardProgressResponse,
    status_code=status.HTTP_200_OK,
)
def review_flashcard(
    flashcard_id: int,
    body: FlashcardReviewRequest,
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Submit a self-rated review for a flashcard and update SM-2 progress."""
    flashcard = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not flashcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found"
        )

    # Verify lecture access for student
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=flashcard.lecture_id,
        user_id=current_student["user_id"],
        role=current_student["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    progress = flashcard_service.record_flashcard_review(
        db,
        flashcard=flashcard,
        student_id=current_student["user_id"],
        quality=body.quality,
    )
    return progress
