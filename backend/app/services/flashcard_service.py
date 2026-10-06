from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.flashcard import Flashcard
from app.models.flashcard_progress import FlashcardProgress
from app.schemas.flashcard_progress import FlashcardReviewItemResponse, FlashcardProgressResponse


def calculate_sm2(quality: int, old_ef: float = 2.5, old_interval: int = 0) -> tuple[float, int]:
    """Calculate new ease factor and interval days using standard SM-2 algorithm.

    Args:
        quality: Self-rated recall quality (0 to 5).
        old_ef: Previous ease factor (default 2.5).
        old_interval: Previous interval in days (default 0).

    Returns:
        tuple of (new_ease_factor, new_interval_days)
    """
    # 1. Update Ease Factor (EF)
    new_ef = old_ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if new_ef < 1.3:
        new_ef = 1.3
    new_ef = round(new_ef, 2)

    # 2. Update Interval (I)
    if quality < 3:
        new_interval = 0
    else:
        if old_interval == 0:
            new_interval = 1
        elif old_interval == 1:
            new_interval = 6
        else:
            new_interval = int(round(old_interval * new_ef))
            if new_interval < 1:
                new_interval = 1

    return new_ef, new_interval


def get_flashcards_for_review(
    db: Session, lecture_id: int, student_id: int
) -> List[FlashcardReviewItemResponse]:
    """Retrieve flashcards for a lecture ordered for review: Due cards first, New cards next, Undue cards last."""
    flashcards = db.query(Flashcard).filter(Flashcard.lecture_id == lecture_id).all()
    if not flashcards:
        return []

    flashcard_ids = [fc.id for fc in flashcards]
    progress_records = (
        db.query(FlashcardProgress)
        .filter(
            FlashcardProgress.student_id == student_id,
            FlashcardProgress.flashcard_id.in_(flashcard_ids),
        )
        .all()
    )
    progress_map = {p.flashcard_id: p for p in progress_records}

    today = date.today()
    due_cards = []
    new_cards = []
    undue_cards = []

    for fc in flashcards:
        prog = progress_map.get(fc.id)
        prog_resp = FlashcardProgressResponse.model_validate(prog) if prog else None
        item = FlashcardReviewItemResponse(
            id=fc.id,
            lecture_id=fc.lecture_id,
            question=fc.question,
            answer=fc.answer,
            created_at=fc.created_at,
            progress=prog_resp,
        )

        if prog is None:
            new_cards.append(item)
        elif prog.next_review_date <= today:
            due_cards.append(item)
        else:
            undue_cards.append(item)

    return due_cards + new_cards + undue_cards


def record_flashcard_review(
    db: Session, flashcard: Flashcard, student_id: int, quality: int
) -> FlashcardProgress:
    """Apply SM-2 algorithm and save/update FlashcardProgress for student and flashcard."""
    prog = (
        db.query(FlashcardProgress)
        .filter(
            FlashcardProgress.student_id == student_id,
            FlashcardProgress.flashcard_id == flashcard.id,
        )
        .first()
    )

    old_ef = prog.ease_factor if prog else 2.5
    old_interval = prog.interval_days if prog else 0

    new_ef, new_interval = calculate_sm2(quality, old_ef=old_ef, old_interval=old_interval)
    today = date.today()
    next_review_date = today + timedelta(days=new_interval)
    now = datetime.now(timezone.utc)

    if prog:
        prog.ease_factor = new_ef
        prog.interval_days = new_interval
        prog.next_review_date = next_review_date
        prog.last_reviewed_at = now
    else:
        prog = FlashcardProgress(
            student_id=student_id,
            flashcard_id=flashcard.id,
            ease_factor=new_ef,
            interval_days=new_interval,
            next_review_date=next_review_date,
            last_reviewed_at=now,
        )
        db.add(prog)

    db.commit()
    db.refresh(prog)
    return prog
