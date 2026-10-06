from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class DoubtCreate(BaseModel):
    question: str


class DoubtAnswer(BaseModel):
    answer: str


class DoubtResponse(BaseModel):
    id: int
    subject_id: int
    lecture_id: int
    student_id: int
    question: str
    status: str
    answer: Optional[str] = None
    answered_by: Optional[int] = None
    answered_at: Optional[datetime] = None
    created_at: datetime
    student_name: Optional[str] = None
    student_rollno: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
