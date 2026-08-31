from pydantic import BaseModel, ConfigDict
from datetime import datetime


class NoteResponse(BaseModel):
    id: int
    lecture_id: int
    markdown_content: str
    summary_text: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FlashcardResponse(BaseModel):
    id: int
    lecture_id: int
    question: str
    answer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizResponse(BaseModel):
    id: int
    lecture_id: int
    question: str
    options_json: str
    correct_answer: str
    explanation: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GlossaryResponse(BaseModel):
    id: int
    lecture_id: int
    term: str
    definition: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
