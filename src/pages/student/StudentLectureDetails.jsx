import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, User } from "lucide-react";

import { lectures } from "../../data/lectures";

function StudentLectureDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find((item) => item.id === Number(id));

  /* =========================================================
     LECTURE NOT FOUND
     ========================================================= */

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

        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>Lecture not found</h3>

          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page student-page">
      {/* =====================================================
          BACK BUTTON
          ===================================================== */}

      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        Back
      </button>

      {/* =====================================================
          LECTURE INFORMATION
          ===================================================== */}

      <section className="card student-lecture-info-card">
        <div className="student-lecture-info-main">
          <div className="student-lecture-large-icon">
            <BookOpen size={24} />
          </div>

          <div>
            <p className="eyebrow">{lecture.subject}</p>

            <h2>{lecture.title}</h2>

            <div className="student-lecture-info-meta">
              <span>
                <User size={14} />
                {lecture.lecturer}
              </span>

              <span>
                <Clock size={14} />
                {lecture.duration}
              </span>

              <span>{lecture.date}</span>
            </div>
          </div>
        </div>

        <span className={`lecture-status ${lecture.status.toLowerCase()}`}>
          {lecture.status}
        </span>
      </section>

      {/* =====================================================
          LEARNING RESOURCES
          ===================================================== */}

      <section className="student-lecture-resources">
        <div className="student-material-header">
          <div>
            <p className="eyebrow">Learning Resources</p>

            <h2>Lecture Materials</h2>

            <p className="muted">
              Access AI-generated learning resources for this lecture.
            </p>
          </div>
        </div>

        {/* ===================================================
            MATERIAL TABS
            =================================================== */}

        <div className="student-material-tabs">
          <button type="button" className="student-material-tab active">
            <BookOpen size={15} />
            Overview
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/transcript`)
            }
          >
            Transcript
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/summary`)}
          >
            Summary
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/key-concepts`)
            }
          >
            Key Concepts
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
          >
            Flashcards
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
          >
            Quiz
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
          >
            Q&A
          </button>
        </div>

        {/* ===================================================
            OVERVIEW CARD
            =================================================== */}

        <div className="card student-material-card">
          <div className="student-material-card-header">
            <div>
              <p className="eyebrow">Overview</p>

              <h3>{lecture.title}</h3>
            </div>
          </div>

          <div className="student-material-content">
            <p>
              This lecture covers the main concepts and topics discussed during
              the session.
            </p>

            <p>
              Use the learning resources above to review the lecture, revise
              important concepts, and test your understanding.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentLectureDetails;
