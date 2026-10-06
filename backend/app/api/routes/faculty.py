from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.dependencies import require_faculty
from app.schemas.quiz_attempt import FacultyStudentProgressItem
from app.services import progress_service

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get(
    "/student-progress",
    response_model=List[FacultyStudentProgressItem],
    status_code=status.HTTP_200_OK,
)
def get_faculty_student_progress(
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Retrieve quiz progress for students enrolled in subjects owned by the faculty."""
    faculty_id = current_faculty["user_id"]
    return progress_service.get_faculty_student_progress(db, faculty_id=faculty_id)
