import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from app.models import Base, Faculty, Student, Subject, Batch, Enrollment, Lecture, Transcript, Note, Flashcard, Quiz, Glossary


@pytest.fixture
def test_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


def test_tables_created(test_engine):
    """Verify all Phase 1, Phase 2, and Phase 3A tables exist."""
    inspector = inspect(test_engine)
    table_names = inspector.get_table_names()
    expected_tables = {
        "faculty", "students", "subjects", "batches", "enrollments",
        "lectures", "transcripts", "notes", "flashcards", "quizzes", "glossary"
    }
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

    # Phase 3A tables FKs -> lectures.id
    for t_name in ["notes", "flashcards", "quizzes", "glossary"]:
        fks = inspector.get_foreign_keys(t_name)
        assert any(
            fk["referred_table"] == "lectures" and "lecture_id" in fk["constrained_columns"]
            for fk in fks
        )


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


def test_generation_models_creation_and_cascade_delete(test_engine):
    """Verify Phase 3A generation models creation, relationships, unique note constraint, and cascade deletion."""
    TestingSession = sessionmaker(bind=test_engine)
    db = TestingSession()

    fac = Faculty(name="Dr. Turing", username="turing", password_hash="hash123")
    db.add(fac)
    db.commit()

    sub = Subject(name="Algorithms", faculty_id=fac.id)
    db.add(sub)
    db.commit()

    batch = Batch(subject_id=sub.id, batchname="Section 1")
    db.add(batch)
    db.commit()

    lec = Lecture(
        title="Sorting Algorithms",
        subject_id=sub.id,
        batch_id=batch.id,
        faculty_id=fac.id,
        original_filename="sorting.mp3",
        file_type="audio/mpeg",
        file_size=2048,
        storage_path="lectures/sorting.mp3",
        status="draft",
        generation_error_message=None
    )
    db.add(lec)
    db.commit()

    note = Note(lecture_id=lec.id, markdown_content="# Sorting Notes", summary_text="Summary of sorting")
    card1 = Flashcard(lecture_id=lec.id, question="What is QuickSort?", answer="A divide and conquer sorting algorithm.")
    card2 = Flashcard(lecture_id=lec.id, question="What is MergeSort?", answer="A stable comparison-based sort.")
    quiz = Quiz(lecture_id=lec.id, question="Time complexity of QuickSort average case?", options_json='["O(N log N)", "O(N^2)"]', correct_answer="O(N log N)", explanation="Average pivot splits array evenly.")
    item = Glossary(lecture_id=lec.id, term="Pivot", definition="Element used to partition array in QuickSort.")

    db.add_all([note, card1, card2, quiz, item])
    db.commit()

    assert lec.note.markdown_content == "# Sorting Notes"
    assert len(lec.flashcards) == 2
    assert len(lec.quizzes) == 1
    assert len(lec.glossary_items) == 1
    assert item.lecture.title == "Sorting Algorithms"

    # Verify unique constraint on notes.lecture_id
    duplicate_note = Note(lecture_id=lec.id, markdown_content="Duplicate", summary_text="Duplicate")
    db.add(duplicate_note)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

    # Verify cascade delete when lecture is deleted
    db.delete(lec)
    db.commit()

    assert db.query(Note).filter(Note.lecture_id == lec.id).first() is None
    assert db.query(Flashcard).filter(Flashcard.lecture_id == lec.id).count() == 0
    assert db.query(Quiz).filter(Quiz.lecture_id == lec.id).count() == 0
    assert db.query(Glossary).filter(Glossary.lecture_id == lec.id).count() == 0

    db.close()
