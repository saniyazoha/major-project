import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Layers3 } from "lucide-react";
import { lectures } from "../../data/lectures";

function StudentFlashcards() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find((item) => item.id === Number(id));

  if (!lecture) {
    return (
      <div className="page student-page">
        <button
          className="back-button"
          onClick={() => navigate("/student/subjects")}
        >
          <ArrowLeft size={15} />
          Back to Subjects
        </button>

        <div className="card student-resource-empty">
          <h3>Lecture not found</h3>
          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  const flashcards = [
    {
      question: "What is the main topic of this lecture?",
      answer:
        "The lecture introduces the main concepts and principles related to the topic being studied.",
    },
    {
      question: "Why is this topic important?",
      answer:
        "Understanding this topic provides an important foundation for learning more advanced concepts in the subject.",
    },
    {
      question: "What are the key ideas to remember?",
      answer:
        "Students should focus on the fundamental definitions, principles, relationships, and practical applications discussed during the lecture.",
    },
    {
      question: "How can the concepts be applied?",
      answer:
        "The concepts can be applied when solving practical problems and understanding related topics within the subject.",
    },
    {
      question: "What should students revise?",
      answer:
        "Students should revise the important concepts, explanations, examples, and conclusions presented during the lecture.",
    },
    {
      question: "What is the main takeaway?",
      answer:
        "The main takeaway is to understand the core ideas rather than only memorizing individual definitions.",
    },
  ];

  return (
    <div className="page student-page">
      {/* Back */}
      <button
        className="back-button"
        onClick={() => navigate(`/student/lectures/${lecture.id}`)}
      >
        <ArrowLeft size={15} />
        Back to Lecture
      </button>

      {/* Lecture Header */}
      <section className="card student-lecture-info-card">
        <div className="student-lecture-info-main">
          <div className="student-lecture-large-icon">
            <BookOpen size={24} />
          </div>

          <div>
            <p className="eyebrow">{lecture.subject}</p>

            <h2>{lecture.title}</h2>

            <div className="student-lecture-info-meta">
              <span>{lecture.lecturer}</span>
              <span>{lecture.duration}</span>
              <span>{lecture.date}</span>
            </div>
          </div>
        </div>

        <span className={`lecture-status ${lecture.status.toLowerCase()}`}>
          {lecture.status}
        </span>
      </section>

      {/* Learning Resources */}
      <section style={{ marginTop: 28 }}>
        <div className="student-material-header">
          <div>
            <p className="eyebrow">Learning Resources</p>

            <h2>Flashcards</h2>

            <p className="muted">
              Use these questions and answers to revise the lecture.
            </p>
          </div>
        </div>

        {/* Resource Tabs */}
        <div className="student-material-tabs">
          <button
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}`)}
          >
            <BookOpen size={15} />
            Overview
          </button>

          <button
            className="student-material-tab"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/transcript`)
            }
          >
            Transcript
          </button>

          <button
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/summary`)}
          >
            Summary
          </button>

          <button
            className="student-material-tab"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/key-concepts`)
            }
          >
            Key Concepts
          </button>

          <button className="student-material-tab active">
            <Layers3 size={15} />
            Flashcards
          </button>

          <button
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
          >
            Quiz
          </button>

          <button
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
          >
            Q&A
          </button>
        </div>

        {/* Flashcards */}
        <div className="student-flashcard-grid">
          {flashcards.map((flashcard, index) => (
            <div className="card student-flashcard" key={index}>
              <div className="student-flashcard-number">{index + 1}</div>

              <h3>{flashcard.question}</h3>

              <div className="student-flashcard-answer">
                <span>ANSWER</span>

                <p>{flashcard.answer}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="student-transcript-note">
          These are sample flashcards for the frontend. The actual AI-generated
          flashcards will be populated when the backend and AI processing
          pipeline are connected.
        </div>
      </section>
    </div>
  );
}

export default StudentFlashcards;
