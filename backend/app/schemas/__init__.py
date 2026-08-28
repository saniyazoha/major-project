from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.academic import (
    SubjectCreate,
    SubjectResponse,
    BatchCreate,
    BatchResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    StudentResponse,
)
from app.schemas.lecture import LectureResponse
from app.schemas.transcript import TranscriptResponse, TranscriptUpdate
from app.schemas.generation import (
    NoteResponse,
    FlashcardResponse,
    QuizResponse,
    GlossaryResponse,
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "SubjectCreate",
    "SubjectResponse",
    "BatchCreate",
    "BatchResponse",
    "EnrollmentCreate",
    "EnrollmentResponse",
    "StudentResponse",
    "LectureResponse",
    "TranscriptResponse",
    "TranscriptUpdate",
    "NoteResponse",
    "FlashcardResponse",
    "QuizResponse",
    "GlossaryResponse",
]
