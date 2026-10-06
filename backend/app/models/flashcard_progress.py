from sqlalchemy import Integer, Float, ForeignKey, DateTime, Date, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import datetime, date
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.flashcard import Flashcard
    from app.models.student import Student


class FlashcardProgress(Base):
    __tablename__ = "flashcard_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    flashcard_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("flashcards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    interval_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_review_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    flashcard: Mapped["Flashcard"] = relationship("Flashcard", back_populates="progress_records")
    student: Mapped["Student"] = relationship("Student")

    __table_args__ = (
        UniqueConstraint("student_id", "flashcard_id", name="uq_student_flashcard_progress"),
    )
