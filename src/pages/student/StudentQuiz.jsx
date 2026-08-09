import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { lectures } from "../../data/lectures";

function StudentQuiz() {
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

  const questions = [
    {
      question:
        "What is the primary purpose of the topic discussed in this lecture?",
      options: [
        "To understand the fundamental concepts",
        "To avoid studying the subject",
        "To replace all practical work",
        "None of the above",
      ],
      answer: 0,
    },
    {
      question: "Which approach is most useful when learning a new concept?",
      options: [
        "Memorizing without understanding",
        "Understanding the concept and its application",
        "Skipping examples",
        "Ignoring important terminology",
      ],
      answer: 1,
    },
    {
      question: "What should a student focus on during revision?",
      options: [
        "Only the lecture title",
        "Only the duration of the lecture",
        "Important concepts, principles, and examples",
        "Only the lecturer's name",
      ],
      answer: 2,
    },
    {
      question: "Why are practical examples useful?",
      options: [
        "They help connect concepts with real situations",
        "They make concepts unnecessary",
        "They replace all learning resources",
        "They are only useful for attendance",
      ],
      answer: 0,
    },
    {
      question: "What is a good way to check understanding?",
      options: [
        "Avoid reviewing the material",
        "Test yourself using questions and examples",
        "Read the title repeatedly",
        "Skip difficult concepts",
      ],
      answer: 1,
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

      {/* Quiz Section */}
      <section style={{ marginTop: 28 }}>
        <div className="student-material-header">
          <div>
            <p className="eyebrow">Learning Resources</p>

            <h2>Lecture Quiz</h2>

            <p className="muted">
              Test your understanding of the concepts covered in this lecture.
            </p>
          </div>
        </div>

        {/* Tabs */}
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

          <button
            className="student-material-tab"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
          >
            Flashcards
          </button>

          <button className="student-material-tab active">Quiz</button>

          <button
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
          >
            Q&A
          </button>
        </div>

        {/* Quiz */}
        <div className="student-quiz-list">
          {questions.map((item, index) => (
            <div className="card student-quiz-card" key={index}>
              <div className="student-quiz-question">
                <span>Question {index + 1}</span>

                <h3>{item.question}</h3>
              </div>

              <div className="student-quiz-options">
                {item.options.map((option, optionIndex) => (
                  <label className="student-quiz-option" key={optionIndex}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionIndex}
                    />

                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="student-quiz-footer">
          <button className="primary-action-button">
            <CheckCircle2 size={16} />
            Submit Quiz
          </button>
        </div>

        {/* Frontend note */}
        <div className="student-transcript-note">
          These questions are sample frontend data. Quiz generation, answer
          evaluation, scoring, and AI-generated questions will be connected when
          the backend and AI processing pipeline are added.
        </div>
      </section>
    </div>
  );
}

export default StudentQuiz;
