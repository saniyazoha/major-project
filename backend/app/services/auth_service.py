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


def authenticate_student(db: Session, roll_no: str, password: str) -> Student | None:
    """Authenticate student against students table using roll number / USN."""
    student = db.query(Student).filter(Student.rollno == roll_no).first()
    if not student:
        return None
    if not security.verify_password(password, student.password_hash):
        return None
    return student


def create_token_for_user(user_id: int, username: str, role: str, name: str, email: str | None = None) -> TokenResponse:
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
        username=username,
        email=email,
    )


def update_student_profile(
    db: Session, student_id: int, name: str | None = None, email: str | None = None
) -> tuple[Student | None, str | None]:
    """Update student profile name and/or email."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None, "USER_NOT_FOUND"

    if name is not None:
        cleaned_name = name.strip()
        if not cleaned_name:
            return None, "INVALID_NAME"
        student.name = cleaned_name

    if email is not None:
        student.email = email.strip() if email.strip() else None

    db.commit()
    db.refresh(student)
    return student, None


def update_faculty_profile(
    db: Session, faculty_id: int, name: str | None = None, email: str | None = None
) -> tuple[Faculty | None, str | None]:
    """Update faculty profile name and/or email."""
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        return None, "USER_NOT_FOUND"

    if name is not None:
        cleaned_name = name.strip()
        if not cleaned_name:
            return None, "INVALID_NAME"
        faculty.name = cleaned_name

    if email is not None:
        faculty.email = email.strip() if email.strip() else None

    db.commit()
    db.refresh(faculty)
    return faculty, None


def change_student_password(
    db: Session, student_id: int, current_password: str, new_password: str
) -> tuple[bool, str | None]:
    """Verify current password and set new password for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return False, "USER_NOT_FOUND"

    if not security.verify_password(current_password, student.password_hash):
        return False, "INCORRECT_PASSWORD"

    cleaned_new = new_password.strip()
    if not cleaned_new or len(cleaned_new) < 6:
        return False, "INVALID_NEW_PASSWORD"

    if current_password == new_password:
        return False, "SAME_PASSWORD"

    student.password_hash = security.hash_password(new_password)
    db.commit()
    return True, None


def change_faculty_password(
    db: Session, faculty_id: int, current_password: str, new_password: str
) -> tuple[bool, str | None]:
    """Verify current password and set new password for a faculty member."""
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        return False, "USER_NOT_FOUND"

    if not security.verify_password(current_password, faculty.password_hash):
        return False, "INCORRECT_PASSWORD"

    cleaned_new = new_password.strip()
    if not cleaned_new or len(cleaned_new) < 6:
        return False, "INVALID_NEW_PASSWORD"

    if current_password == new_password:
        return False, "SAME_PASSWORD"

    faculty.password_hash = security.hash_password(new_password)
    db.commit()
    return True, None
