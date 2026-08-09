import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Lightbulb } from "lucide-react";
import { lectures } from "../../data/lectures";

function StudentKeyConcepts() {
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

  const concepts = [
    {
      title: "Core Concepts",
      description:
        "The fundamental ideas introduced in this lecture and their importance within the subject.",
    },
    {
      title: "Important Principles",
      description:
        "The major principles discussed during the lecture that students should remember for revision.",
    },
    {
      title: "Practical Application",
      description:
        "How the concepts discussed in the lecture can be applied to practical software and learning scenarios.",
    },
    {
      title: "Key Takeaways",
      description:
        "The most important points students should understand after completing this lecture.",
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
            <h2>Key Concepts</h2>
            <p className="muted">
              Review the important concepts identified from this lecture.
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

          <button className="student-material-tab active">
            <Lightbulb size={15} />
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

        {/* Concepts */}
        <div className="student-flashcard-grid">
          {concepts.map((concept, index) => (
            <div className="card student-flashcard" key={concept.title}>
              <div className="student-flashcard-number">{index + 1}</div>

              <h3>{concept.title}</h3>

              <div className="student-flashcard-answer">
                <span>KEY IDEA</span>
                <p>{concept.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StudentKeyConcepts;
