from collections import defaultdict
from typing import List
from sqlalchemy.orm import Session, joinedload

from app.models.student import Student
from app.models.batch import Batch
from app.models.subject import Subject
from app.models.enrollment import Enrollment
from app.models.lecture import Lecture
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.schemas.quiz_attempt import (
    StudentQuizStatsResponse,
    FacultyStudentProgressItem,
)


def get_student_quiz_stats(db: Session, student_id: int) -> StudentQuizStatsResponse:
    """Retrieve aggregate quiz stats across all lectures for the authenticated student."""
    attempts = (
        db.query(QuizAttempt)
        .options(joinedload(QuizAttempt.quiz))
        .filter(QuizAttempt.student_id == student_id)
        .all()
    )
    total_question_attempts = len(attempts)

    if total_question_attempts == 0:
        return StudentQuizStatsResponse(
            student_id=student_id,
            average_score=None,
            total_attempts=0,
        )

    correct_count = sum(1 for a in attempts if a.score == 1)
    average_score = round((correct_count / total_question_attempts) * 100.0, 2)
    distinct_quizzes_attempted = len(
        {a.quiz.lecture_id for a in attempts if a.quiz and a.quiz.lecture_id is not None}
    )

    return StudentQuizStatsResponse(
        student_id=student_id,
        average_score=average_score,
        total_attempts=distinct_quizzes_attempted,
    )


def get_faculty_student_progress(
    db: Session, faculty_id: int
) -> List[FacultyStudentProgressItem]:
    """Retrieve quiz progress for all students enrolled in subjects owned by the faculty."""
    enrolled_records = (
        db.query(Student, Batch)
        .join(Enrollment, Student.id == Enrollment.student_id)
        .join(Batch, Enrollment.batch_id == Batch.id)
        .join(Subject, Batch.subject_id == Subject.id)
        .filter(Subject.faculty_id == faculty_id)
        .all()
    )

    student_map = {}
    for student, batch in enrolled_records:
        if student.id not in student_map:
            student_map[student.id] = {
                "student": student,
                "batch_names": [batch.batchname],
            }
        else:
            if batch.batchname not in student_map[student.id]["batch_names"]:
                student_map[student.id]["batch_names"].append(batch.batchname)

    if not student_map:
        return []

    attempts = (
        db.query(QuizAttempt)
        .options(joinedload(QuizAttempt.quiz))
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Lecture, Quiz.lecture_id == Lecture.id)
        .join(Subject, Lecture.subject_id == Subject.id)
        .filter(Subject.faculty_id == faculty_id)
        .all()
    )

    student_attempts = defaultdict(list)
    for att in attempts:
        student_attempts[att.student_id].append(att)

    progress_items = []
    for student_id, info in student_map.items():
        stu = info["student"]
        atts = student_attempts.get(student_id, [])
        total_question_attempts = len(atts)

        if total_question_attempts == 0:
            avg_score = None
            quizzes_attempted = 0
        else:
            correct_count = sum(1 for a in atts if a.score == 1)
            avg_score = round((correct_count / total_question_attempts) * 100.0, 2)
            quizzes_attempted = len(
                {a.quiz.lecture_id for a in atts if a.quiz and a.quiz.lecture_id is not None}
            )

        progress_items.append(
            FacultyStudentProgressItem(
                student_id=stu.id,
                name=stu.name,
                rollno=stu.rollno,
                batch_name=", ".join(info["batch_names"]),
                avg_score=avg_score,
                quizzes_attempted=quizzes_attempted,
            )
        )

    return progress_items

