from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.subject import Subject
    from app.models.enrollment import Enrollment


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    batchname: Mapped[str] = mapped_column(String(100), nullable=False)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="batches")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="batch", cascade="all, delete-orphan")
