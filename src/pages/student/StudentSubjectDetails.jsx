import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

export default function StudentSubjectDetails() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const subject = useMemo(() => {
    return subjects.find((item) => String(item.id) === String(subjectId));
  }, [subjectId]);

  const subjectLectures = useMemo(() => {
    if (!subject) return [];

    return lectures.filter(
      (lecture) => String(lecture.subjectId) === String(subject.id),
    );
  }, [subject]);

  const completedLectures = subjectLectures.filter(
    (lecture) => lecture.status === "Processed",
  ).length;

  const totalLectures = subject?.lectures ?? subjectLectures.length;

  const progress =
    typeof subject?.progress === "number"
      ? subject.progress
      : Math.round((completedLectures / Math.max(1, totalLectures)) * 100);

  if (!subject) {
    return (
      <div className="page student-page">
        <section className="page-header">
          <div>
            <p className="eyebrow">SUBJECT</p>
            <h1>Subject Not Found</h1>
            <p className="muted">The requested subject could not be found.</p>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/student/subjects")}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page student-page">
      {/* =================================
          HEADER
      ================================= */}

      <section className="page-header">
        <div>
          <p className="eyebrow">SUBJECT</p>

          <h1>{subject.name}</h1>

          <p className="muted">
            {subject.code ? `${subject.code} • ` : ""}
            View lectures and track your learning progress.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={() => navigate("/student/subjects")}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </section>

      {/* =================================
          SUBJECT OVERVIEW
      ================================= */}

      <section className="student-subject-detail-overview">
        <div className="card student-subject-detail-progress">
          <div className="student-detail-icon">
            <TrendingUp size={21} />
          </div>

          <div>
            <p>Overall Progress</p>
            <strong>{progress}%</strong>
          </div>
        </div>

        <div className="card student-subject-detail-stat">
          <div className="student-detail-icon">
            <BookOpen size={21} />
          </div>

          <div>
            <p>Total Lectures</p>
            <strong>{totalLectures}</strong>
          </div>
        </div>

        <div className="card student-subject-detail-stat">
          <div className="student-detail-icon">
            <CheckCircle size={21} />
          </div>

          <div>
            <p>Completed</p>
            <strong>{completedLectures}</strong>
          </div>
        </div>
      </section>

      {/* =================================
          PROGRESS
      ================================= */}

      <section className="card student-subject-progress-panel">
        <div className="student-subject-progress-heading">
          <div>
            <p className="eyebrow">YOUR PROGRESS</p>

            <h2>Learning Progress</h2>

            <p className="muted">
              {completedLectures} of {totalLectures} lectures completed
            </p>
          </div>

          <strong>{progress}%</strong>
        </div>

        <div className="student-detail-progress-bar">
          <div
            className="student-detail-progress-fill"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>
      </section>

      {/* =================================
          LECTURES
      ================================= */}

      <section className="student-subject-lectures-section">
        <div className="student-section-heading">
          <div>
            <p className="eyebrow">LECTURES</p>

            <h2>Available Lectures</h2>

            <p className="muted">
              Select a lecture to view its learning materials.
            </p>
          </div>
        </div>

        {subjectLectures.length === 0 ? (
          <div className="card student-subject-empty">
            <BookOpen size={38} />

            <h3>No lectures available</h3>

            <p>
              Lectures for this subject will appear here when they become
              available.
            </p>
          </div>
        ) : (
          <div className="student-detail-lecture-list">
            {subjectLectures.map((lecture) => {
              const processed = lecture.status === "Processed";

              return (
                <article
                  key={lecture.id}
                  className="card student-detail-lecture-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/student/lectures/${lecture.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();

                      navigate(`/student/lectures/${lecture.id}`);
                    }
                  }}
                >
                  <div className="student-detail-lecture-icon">
                    <PlayCircle size={21} />
                  </div>

                  <div className="student-detail-lecture-main">
                    <div className="student-detail-lecture-top">
                      <span className="student-detail-lecture-number">
                        Lecture
                      </span>

                      <span
                        className={`lecture-status ${
                          processed ? "processed" : "processing"
                        }`}
                      >
                        {processed ? (
                          <>
                            <CheckCircle size={13} />
                            Processed
                          </>
                        ) : (
                          <>
                            <Clock size={13} />
                            Processing
                          </>
                        )}
                      </span>
                    </div>

                    <h3>{lecture.title}</h3>

                    <div className="student-detail-lecture-meta">
                      {lecture.date && <span>{lecture.date}</span>}

                      {lecture.duration && <span>{lecture.duration}</span>}

                      {lecture.lecturer && <span>{lecture.lecturer}</span>}
                    </div>
                  </div>

                  <ArrowRight
                    className="student-detail-lecture-arrow"
                    size={18}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
