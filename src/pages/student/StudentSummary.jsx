import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, BookOpen } from "lucide-react";
import { lectures } from "../../data/lectures";

function StudentSummary() {
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

      {/* Material Header */}
      <section style={{ marginTop: 28 }}>
        <div className="student-material-header">
          <div>
            <p className="eyebrow">Learning Resources</p>
            <h2>Lecture Summary</h2>
            <p className="muted">
              Review the AI-generated summary of this lecture.
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

          <button className="student-material-tab active">
            <FileText size={15} />
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

        {/* Summary */}
        <div className="card student-material-card">
          <div className="student-material-card-header">
            <div>
              <p className="eyebrow">AI Summary</p>
              <h3>{lecture.title}</h3>
            </div>

            <FileText size={20} />
          </div>

          <div className="student-material-content">
            <p>
              This lecture introduces the main ideas and concepts covered during
              the session. The material is organized to help students understand
              the important topics discussed by the lecturer.
            </p>

            <p>
              Students can use this summary as a quick revision resource before
              reviewing the detailed transcript or practicing with the generated
              learning activities.
            </p>

            <p>
              The summary highlights the core subject matter while keeping the
              explanation concise and focused on the learning objectives of the
              lecture.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentSummary;
