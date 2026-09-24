from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class QuizAttemptCreate(BaseModel):
    selected_answer: str


class QuizAttemptResponse(BaseModel):
    id: int
    student_id: int
    quiz_id: int
    score: int
    selected_answer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MostMissedQuestion(BaseModel):
    quiz_id: int
    question: str
    incorrect_count: int
    total_attempts: int


class StudentQuizResult(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    correct_count: int
    total_questions: int
    score_percentage: float


class FacultyQuizPerformanceResponse(BaseModel):
    lecture_id: int
    average_score: float
    students_attempted: int
    student_results: List[StudentQuizResult]
    most_missed_questions: List[MostMissedQuestion]


class StudentQuizStatsResponse(BaseModel):
    student_id: int
    average_score: Optional[float] = None
    total_attempts: int
