import os
from collections import defaultdict
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.api.dependencies import get_current_user, require_faculty, require_student
from app.schemas.lecture import LectureResponse
from app.schemas.transcript import TranscriptResponse, TranscriptUpdate
from app.schemas.generation import NoteResponse, FlashcardResponse, QuizResponse, GlossaryResponse
from app.schemas.analytics import LectureAnalyticsResponse
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    StudentQuizResult,
    FacultyQuizPerformanceResponse,
    MostMissedQuestion,
    StudentQuizStatsResponse,
)
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.glossary import Glossary
from app.models.lecture_analytics import LectureAnalytics
from app.models.quiz_attempt import QuizAttempt
from app.models.student import Student
from app.services import lecture_service, storage_service, transcript_processing_service, generation_service, analytics_service

router = APIRouter(prefix="/lectures", tags=["lectures"])


ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}
ALLOWED_CONTENT_TYPES = {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a"}


def is_valid_audio_file(file: UploadFile) -> bool:
    """Validate file extension and content type for audio uploads."""
    if not file.filename:
        return False
    ext = os.path.splitext(file.filename)[1].lower()
    if ext in ALLOWED_EXTENSIONS:
        return True
    if file.content_type and file.content_type.lower() in ALLOWED_CONTENT_TYPES:
        return True
    return False


@router.post("/upload", response_model=LectureResponse, status_code=status.HTTP_201_CREATED)
def upload_lecture(
    title: str = Form(..., min_length=1),
    batch_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty upload endpoint for lecture audio and metadata."""
    if not is_valid_audio_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audio file type. Allowed formats: .mp3, .wav, .m4a",
        )

    try:
        contents = file.file.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file",
        )

    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    ext = os.path.splitext(file.filename)[1].lower() or ".mp3"
    file_type = file.content_type or f"audio/{ext.lstrip('.')}"

    # Delegate storage upload to storage service abstraction
    storage_path = storage_service.upload_lecture_file(
        filename=file.filename,
        file_bytes=contents,
        content_type=file_type
    )

    # Create lecture database record
    lecture, error = lecture_service.create_lecture(
        db,
        title=title,
        batch_id=batch_id,
        faculty_id=current_faculty["user_id"],
        original_filename=file.filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
    )

    if error == "BATCH_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )
    if error == "NOT_BATCH_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not own the subject for this batch"
        )

    return lecture


@router.get("", response_model=List[LectureResponse], status_code=status.HTTP_200_OK)
def get_lectures(
    batch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve lectures accessible to the user based on role and enrollment."""
    return lecture_service.get_lectures_for_user(
        db, user_id=current_user["user_id"], role=current_user["role"], batch_id=batch_id
    )


@router.get("/{lecture_id}", response_model=LectureResponse, status_code=status.HTTP_200_OK)
def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a single lecture by ID if the user has valid access rights."""
    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=lecture_id, user_id=current_user["user_id"], role=current_user["role"]
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )
    return lecture


@router.post("/{lecture_id}/transcribe", status_code=status.HTTP_202_ACCEPTED)
def trigger_transcription(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty endpoint to trigger lecture transcription via background task."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_faculty["user_id"],
        role="faculty",
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if transcript and transcript.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transcript already completed; re-transcription not supported in this phase",
        )

    background_tasks.add_task(
        transcript_processing_service.process_lecture_transcription,
        db,
        lecture_id,
    )
    return {"lecture_id": lecture_id, "status": "processing"}


@router.post("/{lecture_id}/generate", status_code=status.HTTP_202_ACCEPTED)
def trigger_generation(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty endpoint to trigger LLM content generation via background task."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_faculty["user_id"],
        role="faculty",
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or transcript.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transcript is missing or not completed for generation",
        )

    if lecture.status in ("draft", "broadcast"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Generation not allowed for lecture in status '{lecture.status}'",
        )

    background_tasks.add_task(
        generation_service.process_lecture_generation,
        db,
        lecture_id,
    )
    return {"lecture_id": lecture_id, "message": "Generation task initiated successfully"}


@router.post("/{lecture_id}/broadcast", response_model=LectureResponse, status_code=status.HTTP_200_OK)
def broadcast_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty endpoint to transition a lecture from draft to broadcast state."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_faculty["user_id"],
        role="faculty",
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    if lecture.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lecture in status '{lecture.status}' cannot be broadcast. Only lectures in status 'draft' can be broadcast.",
        )

    lecture.status = "broadcast"
    db.commit()
    db.refresh(lecture)

    return lecture


@router.get("/{lecture_id}/transcript", response_model=TranscriptResponse, status_code=status.HTTP_200_OK)
def get_transcript(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the transcript for a lecture following existing access rules."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found for this lecture"
        )

    return transcript


@router.patch("/{lecture_id}/transcript", response_model=TranscriptResponse, status_code=status.HTTP_200_OK)
def update_transcript_correction(
    lecture_id: int,
    body: TranscriptUpdate,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty endpoint to review and save corrected transcript text for a completed lecture transcript via PATCH."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_faculty["user_id"],
        role="faculty",
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    # Protect transcript correction after successful generation
    if lecture.status in ("draft", "broadcast"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transcript correction not allowed for lecture in status '{lecture.status}'",
        )

    transcript, err = transcript_processing_service.update_corrected_transcript(
        db,
        lecture_id=lecture_id,
        corrected_text=body.corrected_text,
    )

    if err == "TRANSCRIPT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found for this lecture"
        )
    if err == "TRANSCRIPT_NOT_READY":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Transcript is not completed and cannot be edited"
        )

    return transcript


@router.get("/{lecture_id}/notes", response_model=NoteResponse, status_code=status.HTTP_200_OK)
def get_lecture_notes(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the generated Note for a lecture if user is authorized."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    note = db.query(Note).filter(Note.lecture_id == lecture_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note content not found for this lecture"
        )

    return note


@router.get("/{lecture_id}/flashcards", response_model=List[FlashcardResponse], status_code=status.HTTP_200_OK)
def get_lecture_flashcards(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the list of generated Flashcards for a lecture if user is authorized."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    flashcards = db.query(Flashcard).filter(Flashcard.lecture_id == lecture_id).all()
    return flashcards


@router.get("/{lecture_id}/quizzes", response_model=List[QuizResponse], status_code=status.HTTP_200_OK)
def get_lecture_quizzes(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the list of generated Quizzes for a lecture if user is authorized."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    quizzes = db.query(Quiz).filter(Quiz.lecture_id == lecture_id).all()
    return quizzes


@router.get("/{lecture_id}/glossary", response_model=List[GlossaryResponse], status_code=status.HTTP_200_OK)
def get_lecture_glossary(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the list of generated Glossary items for a lecture if user is authorized."""
    lecture, error = lecture_service.get_lecture_by_id(
        db,
        lecture_id=lecture_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    glossary_items = db.query(Glossary).filter(Glossary.lecture_id == lecture_id).all()
    return glossary_items


@router.post("/{lecture_id}/analytics", response_model=LectureAnalyticsResponse, status_code=status.HTTP_200_OK)
def create_or_update_lecture_analytics(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty endpoint to trigger/re-trigger analytics computation for an owned lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )

    if lecture.faculty_id != current_faculty["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    try:
        analytics = analytics_service.compute_and_save_lecture_analytics(db, lecture_id=lecture_id)
    except analytics_service.TranscriptNotCompletedError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(e)
        )

    return analytics


@router.get("/{lecture_id}/analytics", response_model=LectureAnalyticsResponse, status_code=status.HTTP_200_OK)
def get_lecture_analytics(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty endpoint to read persisted analytics for an owned lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )

    if lecture.faculty_id != current_faculty["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    analytics = db.query(LectureAnalytics).filter(LectureAnalytics.lecture_id == lecture_id).first()
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analytics not found for this lecture"
        )
    return analytics


@router.post(
    "/{lecture_id}/quizzes/{quiz_id}/attempt",
    response_model=QuizAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_quiz_attempt(
    lecture_id: int,
    quiz_id: int,
    body: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Student endpoint to submit a single quiz question attempt."""
    student_id = current_student["user_id"]

    # 1. Authorize student access & check broadcast status via lecture service
    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=lecture_id, user_id=student_id, role="student"
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    # 2. Confirm quiz belongs to lecture_id
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz or quiz.lecture_id != lecture_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found for this lecture",
        )

    # 3. Validate selected_answer representation
    if not body.selected_answer or not body.selected_answer.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="selected_answer is required",
        )

    # 4. Check for existing attempt (app-level check)
    existing_attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.student_id == student_id,
            QuizAttempt.quiz_id == quiz_id,
        )
        .first()
    )
    if existing_attempt:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Quiz already attempted by this student",
        )

    # 5. Compute score SERVER-SIDE (1 if selected_answer == quiz.correct_answer else 0)
    score = 1 if body.selected_answer.strip() == quiz.correct_answer.strip() else 0

    # 6. Persist attempt with DB uniqueness fallback
    try:
        attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=score,
            selected_answer=body.selected_answer,
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Quiz already attempted by this student",
        )

    return attempt


@router.get(
    "/{lecture_id}/quizzes/attempts",
    response_model=List[QuizAttemptResponse],
    status_code=status.HTTP_200_OK,
)
def get_student_quiz_attempts(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Retrieve logged-in student's quiz attempts for a specific lecture."""
    student_id = current_student["user_id"]
    lecture, error = lecture_service.get_lecture_by_id(
        db, lecture_id=lecture_id, user_id=student_id, role="student"
    )
    if error == "LECTURE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )
    if error == "ACCESS_DENIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    attempts = (
        db.query(QuizAttempt)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .filter(
            Quiz.lecture_id == lecture_id,
            QuizAttempt.student_id == student_id,
        )
        .all()
    )
    return attempts


@router.get(
    "/{lecture_id}/quiz-performance",
    response_model=FacultyQuizPerformanceResponse,
    status_code=status.HTTP_200_OK,
)
def get_faculty_quiz_performance(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Faculty-only endpoint to retrieve aggregate student quiz performance for an owned lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found"
        )

    if lecture.faculty_id != current_faculty["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this lecture"
        )

    quizzes = db.query(Quiz).filter(Quiz.lecture_id == lecture_id).all()
    if not quizzes:
        return FacultyQuizPerformanceResponse(
            lecture_id=lecture_id,
            average_score=0.0,
            students_attempted=0,
            student_results=[],
            most_missed_questions=[],
        )

    quiz_map = {q.id: q.question for q in quizzes}
    quiz_ids = list(quiz_map.keys())
    total_quiz_questions = len(quizzes)

    attempts = (
        db.query(QuizAttempt)
        .options(joinedload(QuizAttempt.student))
        .filter(QuizAttempt.quiz_id.in_(quiz_ids))
        .all()
    )

    if not attempts:
        return FacultyQuizPerformanceResponse(
            lecture_id=lecture_id,
            average_score=0.0,
            students_attempted=0,
            student_results=[],
            most_missed_questions=[],
        )

    # Group attempts by student_id
    student_attempts = defaultdict(list)
    for attempt in attempts:
        student_attempts[attempt.student_id].append(attempt)

    students_attempted = len(student_attempts)
    student_results = []

    for student_id, st_attempts in student_attempts.items():
        student_obj = st_attempts[0].student if st_attempts else None
        if not student_obj:
            student_obj = db.query(Student).filter(Student.id == student_id).first()

        name = student_obj.name if student_obj else f"Student #{student_id}"
        email = (
            student_obj.username
            if student_obj and student_obj.username
            else f"student_{student_id}"
        )

        correct_count = sum(1 for a in st_attempts if a.score == 1)
        score_percentage = (
            round((correct_count / total_quiz_questions) * 100.0, 2)
            if total_quiz_questions > 0
            else 0.0
        )

        student_results.append(
            StudentQuizResult(
                student_id=student_id,
                student_name=name,
                student_email=email,
                correct_count=correct_count,
                total_questions=total_quiz_questions,
                score_percentage=score_percentage,
            )
        )

    student_results.sort(key=lambda x: x.student_name)

    average_score = (
        round(
            sum(s.score_percentage for s in student_results) / students_attempted, 2
        )
        if students_attempted > 0
        else 0.0
    )

    most_missed = []
    for q_id in quiz_ids:
        q_attempts = [a for a in attempts if a.quiz_id == q_id]
        if not q_attempts:
            continue
        q_total = len(q_attempts)
        q_incorrect = sum(1 for a in q_attempts if a.score == 0)
        if q_incorrect > 0:
            most_missed.append(
                MostMissedQuestion(
                    quiz_id=q_id,
                    question=quiz_map[q_id],
                    incorrect_count=q_incorrect,
                    total_attempts=q_total,
                )
            )

    most_missed.sort(key=lambda x: (-x.incorrect_count, x.quiz_id))

    return FacultyQuizPerformanceResponse(
        lecture_id=lecture_id,
        average_score=average_score,
        students_attempted=students_attempted,
        student_results=student_results,
        most_missed_questions=most_missed,
    )



@router.get(
    "/student/quiz-stats",
    response_model=StudentQuizStatsResponse,
    status_code=status.HTTP_200_OK,
)
def get_student_quiz_stats(
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Retrieve aggregate quiz stats for the authenticated student."""
    student_id = current_student["user_id"]
    attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).all()

    total_attempts = len(attempts)
    if total_attempts == 0:
        return StudentQuizStatsResponse(
            student_id=student_id,
            average_score=None,
            total_attempts=0,
        )

    correct_count = sum(1 for a in attempts if a.score == 1)
    average_score = round((correct_count / total_attempts) * 100.0, 2)

    return StudentQuizStatsResponse(
        student_id=student_id,
        average_score=average_score,
        total_attempts=total_attempts,
    )
