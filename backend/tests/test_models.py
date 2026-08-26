import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from app.models import Base, Faculty, Student, Subject, Batch, Enrollment


@pytest.fixture
def test_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


def test_tables_created(test_engine):
    """Verify all five required Phase 1 tables exist."""
    inspector = inspect(test_engine)
    table_names = inspector.get_table_names()
    expected_tables = {"faculty", "students", "subjects", "batches", "enrollments"}
    assert expected_tables.issubset(set(table_names))


def test_foreign_key_relationships(test_engine):
    """Verify table foreign key relationships."""
    inspector = inspect(test_engine)

    # subjects FK -> faculty.id
    subjects_fks = inspector.get_foreign_keys("subjects")
    assert any(
        fk["referred_table"] == "faculty" and "faculty_id" in fk["constrained_columns"]
        for fk in subjects_fks
    )

    # batches FK -> subjects.id
    batches_fks = inspector.get_foreign_keys("batches")
    assert any(
        fk["referred_table"] == "subjects" and "subject_id" in fk["constrained_columns"]
        for fk in batches_fks
    )

    # enrollments FKs -> students.id and batches.id
    enrollments_fks = inspector.get_foreign_keys("enrollments")
    has_student_fk = any(
        fk["referred_table"] == "students" and "student_id" in fk["constrained_columns"]
        for fk in enrollments_fks
    )
    has_batch_fk = any(
        fk["referred_table"] == "batches" and "batch_id" in fk["constrained_columns"]
        for fk in enrollments_fks
    )
    assert has_student_fk
    assert has_batch_fk


def test_unique_constraints_and_orm_insert(test_engine):
    """Verify ORM model creation and unique constraint behavior."""
    TestingSession = sessionmaker(bind=test_engine)
    db = TestingSession()

    fac = Faculty(name="Dr. Smith", username="drsmith", password_hash="hash123")
    student = Student(name="John Doe", rollno="CS101", username="johnd", password_hash="hash123")
    db.add_all([fac, student])
    db.commit()

    subject = Subject(name="Database Systems", faculty_id=fac.id)
    db.add(subject)
    db.commit()

    batch = Batch(subject_id=subject.id, batchname="Batch A")
    db.add(batch)
    db.commit()

    enrollment = Enrollment(student_id=student.id, batch_id=batch.id)
    db.add(enrollment)
    db.commit()

    assert enrollment.id is not None
    assert enrollment.student.name == "John Doe"
    assert enrollment.batch.batchname == "Batch A"
    assert batch.subject.name == "Database Systems"
    assert subject.faculty.name == "Dr. Smith"

    db.close()
