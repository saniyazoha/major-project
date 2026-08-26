from sqlalchemy.orm import Session
from app.models.faculty import Faculty
from app.models.student import Student
from app.core import security
from app.schemas.auth import TokenResponse


def authenticate_faculty(db: Session, username: str, password: str) -> Faculty | None:
    """Authenticate faculty against faculty table."""
    faculty = db.query(Faculty).filter(Faculty.username == username).first()
    if not faculty:
        return None
    if not security.verify_password(password, faculty.password_hash):
        return None
    return faculty


def authenticate_student(db: Session, username: str, password: str) -> Student | None:
    """Authenticate student against students table."""
    student = db.query(Student).filter(Student.username == username).first()
    if not student:
        return None
    if not security.verify_password(password, student.password_hash):
        return None
    return student


def create_token_for_user(user_id: int, username: str, role: str, name: str) -> TokenResponse:
    """Generate JWT access token and return token response model."""
    token_data = {
        "sub": str(user_id),
        "username": username,
        "role": role
    }
    access_token = security.create_access_token(data=token_data)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=role,
        user_id=user_id,
        name=name,
        username=username
    )
