from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import Optional


class FlashcardProgressResponse(BaseModel):
    id: int
    student_id: int
    flashcard_id: int
    ease_factor: float
    interval_days: int
    next_review_date: date
    last_reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FlashcardReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5, description="Self-rated recall quality from 0 to 5")


class FlashcardReviewItemResponse(BaseModel):
    id: int
    lecture_id: int
    question: str
    answer: str
    created_at: datetime
    progress: Optional[FlashcardProgressResponse] = None

    model_config = ConfigDict(from_attributes=True)
