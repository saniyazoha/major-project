from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.faculty import Faculty
    from app.models.batch import Batch


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)

    faculty: Mapped["Faculty"] = relationship("Faculty", back_populates="subjects")
    batches: Mapped[List["Batch"]] = relationship("Batch", back_populates="subject", cascade="all, delete-orphan")
