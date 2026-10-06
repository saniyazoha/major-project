from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import datetime
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.subject import Subject


class SubjectGlossary(Base):
    __tablename__ = "subject_glossary"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    term: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_term: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    subject: Mapped["Subject"] = relationship("Subject", back_populates="subject_glossary_items")

    __table_args__ = (
        UniqueConstraint("subject_id", "normalized_term", name="uq_subject_glossary_normalized_term"),
    )
