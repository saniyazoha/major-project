import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  User,
  BarChart3,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import { lectures } from "../../data/lectures";
import { subjects } from "../../data/subjects";

function FacultyLectureDetails() {
  const navigate = useNavigate();

  const { subjectId, lectureId } = useParams();

  const subject = subjects.find(
    (item) => String(item.id) === String(subjectId),
  );

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  if (!subject || !lecture) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/faculty/subjects/${subjectId}`)}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          className="card"
          style={{
            marginTop: 20,
            padding: 32,
          }}
        >
          <h2>Lecture not found</h2>

          <p className="muted">The selected lecture could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Back */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate(`/faculty/subjects/${subjectId}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={16} />
        Back to {subject.name}
      </button>

      {/* Header */}

      <section style={{ marginTop: 20 }}>
        <p className="eyebrow">{subject.name}</p>

        <h1>{lecture.title}</h1>

        <p className="muted">
          Detailed information and analytics for this lecturer and lecture.
        </p>
      </section>

      {/* Lecture Information */}

      <section
        className="card"
        style={{
          marginTop: 24,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className="upload-icon">
            <User size={23} />
          </div>

          <div>
            <p className="eyebrow">LECTURER</p>

            <h2
              style={{
                margin: 0,
              }}
            >
              {lecture.lecturer}
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          <div>
            <p className="muted">Subject</p>

            <strong>{subject.name}</strong>
          </div>

          <div>
            <p className="muted">Lecture</p>

            <strong>{lecture.title}</strong>
          </div>

          <div>
            <p className="muted">Duration</p>

            <strong>{lecture.duration || "—"}</strong>
          </div>

          <div>
            <p className="muted">Date</p>

            <strong>{lecture.date || "—"}</strong>
          </div>
        </div>
      </section>

      {/* Analytics CTA */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BarChart3 size={22} />

              <h3
                style={{
                  margin: 0,
                }}
              >
                Lecturer Analytics
              </h3>
            </div>

            <p className="muted">
              View speaking rate, frequently used words, speech clarity, and how
              these metrics change throughout the lecture.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-button"
            onClick={() =>
              navigate(
                `/faculty/subjects/${subjectId}/lectures/${lectureId}/analytics`,
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Open Analytics
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default FacultyLectureDetails;
