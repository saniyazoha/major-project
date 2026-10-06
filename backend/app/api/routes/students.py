from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import require_faculty, require_student
from app.schemas.academic import StudentResponse
from app.schemas.quiz_attempt import StudentQuizStatsResponse
from app.services import academic_service, progress_service

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/quiz-stats", response_model=StudentQuizStatsResponse, status_code=status.HTTP_200_OK)
def get_student_quiz_stats(
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Retrieve aggregate quiz stats for the authenticated student across all lectures."""
    student_id = current_student["user_id"]
    return progress_service.get_student_quiz_stats(db, student_id=student_id)


@router.get("/lookup", response_model=StudentResponse, status_code=status.HTTP_200_OK)
def lookup_student_by_rollno(
    rollno: str = Query(..., min_length=1, description="Student roll number / USN"),
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty-only endpoint to look up an existing student by roll number / USN."""
    student = academic_service.get_student_by_rollno(db, rollno=rollno.strip())
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )
    return student
