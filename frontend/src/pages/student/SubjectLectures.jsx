import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  PlayCircle,
  Clock,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

export default function SubjectLectures() {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const subject = useMemo(() => {
    return subjects.find((s) => String(s.id) === String(subjectId));
  }, [subjectId]);

  const subjectLectures = useMemo(() => {
    if (!subject) return [];
    return lectures.filter((l) => String(l.subjectId) === String(subject.id));
  }, [subject]);

  if (!subject) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">SUBJECT</p>
            <h1>Subject Not Found</h1>
            <p className="muted">The requested subject could not be found.</p>
          </div>

          <button
            className="secondary-button"
            onClick={() => navigate("/student/subjects")}
          >
            <ArrowLeft size={17} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="details-page-header">
        <div>
          <p className="eyebrow">SUBJECT</p>
          <h1>{subject.name}</h1>
          <p className="muted">
            {subject.code ? `${subject.code} • ` : ""}View lectures and track
            your learning progress.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/student/subjects")}
        >
          <ArrowLeft size={17} />
          Back
        </button>
      </section>

      <section className="details-lectures-section">
        <div className="details-section-header">
          <div>
            <p className="eyebrow">LECTURES</p>
            <h2>Available Lectures</h2>
            <p className="muted">
              Select a lecture to view its learning materials.
            </p>
          </div>
        </div>

        {subjectLectures.length === 0 ? (
          <div className="details-empty-state">
            <BookOpen size={38} />
            <h3>No lectures available</h3>
            <p>
              Lectures for this subject will appear here when they are
              available.
            </p>
          </div>
        ) : (
          <div className="details-lecture-list">
            {subjectLectures.map((lecture) => (
              <button
                type="button"
                className="details-lecture-card"
                key={lecture.id}
                onClick={() => navigate(`/student/lectures/${lecture.id}`)}
              >
                <div className="details-lecture-main">
                  <div className="details-lecture-icon">
                    <PlayCircle size={20} />
                  </div>

                  <div className="details-lecture-content">
                    <div className="details-lecture-top">
                      <span className="details-lecture-label">Lecture</span>

                      <span
                        className={`details-status ${lecture.status === "Processed" ? "processed" : "processing"}`}
                      >
                        {lecture.status}
                      </span>
                    </div>

                    <h3>{lecture.title}</h3>

                    <div className="details-lecture-meta">
                      <span>{lecture.date}</span>
                      {lecture.duration && (
                        <>
                          <span className="meta-separator">•</span>
                          <span className="meta-with-icon">
                            <Clock size={14} />
                            {lecture.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="details-lecture-arrow">
                  <ArrowRight size={18} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
