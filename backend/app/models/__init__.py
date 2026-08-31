from app.db.base import Base
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.glossary import Glossary

__all__ = [
    "Base",
    "Faculty",
    "Student",
    "Subject",
    "Batch",
    "Enrollment",
    "Lecture",
    "Transcript",
    "Note",
    "Flashcard",
    "Quiz",
    "Glossary",
]
