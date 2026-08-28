from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.subject import Subject
    from app.models.batch import Batch
    from app.models.faculty import Faculty
    from app.models.transcript import Transcript
    from app.models.note import Note
    from app.models.flashcard import Flashcard
    from app.models.quiz import Quiz
    from app.models.glossary import Glossary


class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject_id: Mapped[int] = mapped_column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    batch_id: Mapped[int] = mapped_column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="uploaded")
    generation_error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    subject: Mapped["Subject"] = relationship("Subject")
    batch: Mapped["Batch"] = relationship("Batch")
    faculty: Mapped["Faculty"] = relationship("Faculty")
    transcript: Mapped[Optional["Transcript"]] = relationship(
        "Transcript", uselist=False, back_populates="lecture", cascade="all, delete-orphan"
    )
    note: Mapped[Optional["Note"]] = relationship(
        "Note", uselist=False, back_populates="lecture", cascade="all, delete-orphan"
    )
    flashcards: Mapped[List["Flashcard"]] = relationship(
        "Flashcard", back_populates="lecture", cascade="all, delete-orphan"
    )
    quizzes: Mapped[List["Quiz"]] = relationship(
        "Quiz", back_populates="lecture", cascade="all, delete-orphan"
    )
    glossary_items: Mapped[List["Glossary"]] = relationship(
        "Glossary", back_populates="lecture", cascade="all, delete-orphan"
    )
