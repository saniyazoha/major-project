from sqlalchemy import Integer, ForeignKey, DateTime, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import datetime
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.quiz import Quiz
    from app.models.student import Student


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quiz: Mapped["Quiz"] = relationship("Quiz")
    student: Mapped["Student"] = relationship("Student")

    __table_args__ = (
        UniqueConstraint("student_id", "quiz_id", name="uq_student_quiz_attempt"),
    )
