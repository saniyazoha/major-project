import json
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, DateTime, Text, func, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.lecture import Lecture
    from app.models.subject import Subject


class VectorType(TypeDecorator):
    """Custom type decorator for pgvector.sqlalchemy.Vector in Postgres and Text/JSON in SQLite."""
    impl = Text
    cache_ok = True

    def __init__(self, dim=384):
        super().__init__()
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Vector(self.dim))
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        else:
            if isinstance(value, (list, tuple)):
                return json.dumps(list(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        else:
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return value
            return value


class NoteEmbedding(Base):
    __tablename__ = "note_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lecture_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lectures.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list] = mapped_column(VectorType(384), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    lecture: Mapped["Lecture"] = relationship("Lecture")
    subject: Mapped["Subject"] = relationship("Subject")
