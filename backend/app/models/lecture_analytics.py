from sqlalchemy import Float, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import datetime
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.lecture import Lecture


class LectureAnalytics(Base):
    __tablename__ = "lecture_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lecture_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lectures.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    avg_wpm: Mapped[float] = mapped_column(Float, nullable=False)
    wpm_by_segment_json: Mapped[str] = mapped_column(Text, nullable=False)
    word_frequency_json: Mapped[str] = mapped_column(Text, nullable=False)
    filler_word_counts_json: Mapped[str] = mapped_column(Text, nullable=False)
    keyword_frequency_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    lecture: Mapped["Lecture"] = relationship("Lecture", back_populates="analytics")
