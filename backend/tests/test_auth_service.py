import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Faculty, Student
from app.core import security
from app.services import auth_service


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        # Seed test faculty & student
        fac = Faculty(
            name="Dr. Alan Turing",
            username="turing",
            password_hash=security.hash_password("Enigma123")
        )
        stu = Student(
            name="Ada Lovelace",
            rollno="CS2026-01",
            username="ada",
            password_hash=security.hash_password("AnalyticalEngine")
        )
        session.add_all([fac, stu])
        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_authenticate_faculty_success(db_session):
    fac = auth_service.authenticate_faculty(db_session, "turing", "Enigma123")
    assert fac is not None
    assert fac.name == "Dr. Alan Turing"
    assert fac.username == "turing"


def test_authenticate_faculty_invalid_password(db_session):
    fac = auth_service.authenticate_faculty(db_session, "turing", "WrongPassword")
    assert fac is None


def test_authenticate_faculty_non_existent_user(db_session):
    fac = auth_service.authenticate_faculty(db_session, "nonexistent", "Enigma123")
    assert fac is None


def test_authenticate_student_success(db_session):
    stu = auth_service.authenticate_student(db_session, "ada", "AnalyticalEngine")
    assert stu is not None
    assert stu.name == "Ada Lovelace"
    assert stu.rollno == "CS2026-01"


def test_authenticate_student_invalid_password(db_session):
    stu = auth_service.authenticate_student(db_session, "ada", "WrongPassword")
    assert stu is None


def test_authenticate_student_non_existent_user(db_session):
    stu = auth_service.authenticate_student(db_session, "nobody", "AnalyticalEngine")
    assert stu is None
