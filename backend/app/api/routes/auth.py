from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import require_student, require_faculty
from app.models.student import Student
from app.models.faculty import Faculty
from app.schemas.auth import (
    LoginRequest,
    StudentLoginRequest,
    TokenResponse,
    ProfileUpdateRequest,
    PasswordChangeRequest,
    UserProfileResponse,
)
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
        name=faculty.name,
        email=faculty.email,
    )


@router.post("/student/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_student(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    """Authenticate student user using roll number / USN and password, returning JWT access token."""
    student = auth_service.authenticate_student(
        db,
        roll_no=payload.roll_no,
        password=payload.password
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect USN or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_service.create_token_for_user(
        user_id=student.id,
        username=student.username,
        role="student",
        name=student.name,
        email=student.email,
    )


@router.get("/student/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def get_student_profile(
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Get authenticated student profile information."""
    student_id = current_student["user_id"]
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    return UserProfileResponse(
        id=student.id,
        name=student.name,
        username=student.username,
        role="student",
        email=student.email,
        rollno=student.rollno,
    )


@router.patch("/student/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def update_student_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Update student profile name and/or email."""
    student_id = current_student["user_id"]
    student, error = auth_service.update_student_profile(
        db, student_id=student_id, name=payload.name, email=payload.email
    )
    if error == "USER_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    if error == "INVALID_NAME":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")

    return UserProfileResponse(
        id=student.id,
        name=student.name,
        username=student.username,
        role="student",
        email=student.email,
        rollno=student.rollno,
    )


@router.get("/faculty/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def get_faculty_profile(
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Get authenticated faculty profile information."""
    faculty_id = current_faculty["user_id"]
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty profile not found")

    return UserProfileResponse(
        id=faculty.id,
        name=faculty.name,
        username=faculty.username,
        role="faculty",
        email=faculty.email,
    )


@router.patch("/faculty/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def update_faculty_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Update faculty profile name and/or email."""
    faculty_id = current_faculty["user_id"]
    faculty, error = auth_service.update_faculty_profile(
        db, faculty_id=faculty_id, name=payload.name, email=payload.email
    )
    if error == "USER_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty profile not found")
    if error == "INVALID_NAME":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")

    return UserProfileResponse(
        id=faculty.id,
        name=faculty.name,
        username=faculty.username,
        role="faculty",
        email=faculty.email,
    )


@router.post("/student/change-password", status_code=status.HTTP_200_OK)
def change_student_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_student: dict = Depends(require_student),
):
    """Change authenticated student's account password."""
    student_id = current_student["user_id"]
    success, error = auth_service.change_student_password(
        db,
        student_id=student_id,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    if error == "USER_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student user not found")
    if error == "INCORRECT_PASSWORD":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    if error == "INVALID_NEW_PASSWORD":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters long")
    if error == "SAME_PASSWORD":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password cannot be identical to current password")

    return {"message": "Password changed successfully"}


@router.post("/faculty/change-password", status_code=status.HTTP_200_OK)
def change_faculty_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_faculty: dict = Depends(require_faculty),
):
    """Change authenticated faculty member's account password."""
    faculty_id = current_faculty["user_id"]
    success, error = auth_service.change_faculty_password(
        db,
        faculty_id=faculty_id,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    if error == "USER_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty user not found")
    if error == "INCORRECT_PASSWORD":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    if error == "INVALID_NEW_PASSWORD":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters long")
    if error == "SAME_PASSWORD":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password cannot be identical to current password")

    return {"message": "Password changed successfully"}
