from app.db.base import Base
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.batch import Batch
from app.models.enrollment import Enrollment
from app.models.lecture import Lecture
from app.models.transcript import Transcript

__all__ = ["Base", "Faculty", "Student", "Subject", "Batch", "Enrollment", "Lecture", "Transcript"]
