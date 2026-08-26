import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user, require_faculty
from app.schemas.lecture import LectureResponse
from app.services import lecture_service, storage_service

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
