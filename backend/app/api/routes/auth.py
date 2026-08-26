from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/faculty/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_faculty(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate faculty user and return JWT access token."""
    faculty = auth_service.authenticate_faculty(
        db,
        username=payload.username,
        password=payload.password
    )
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_service.create_token_for_user(
        user_id=faculty.id,
        username=faculty.username,
        role="faculty",
        name=faculty.name
    )


@router.post("/student/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_student(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate student user and return JWT access token."""
    student = auth_service.authenticate_student(
        db,
        username=payload.username,
        password=payload.password
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_service.create_token_for_user(
        user_id=student.id,
        username=student.username,
        role="student",
        name=student.name
    )
