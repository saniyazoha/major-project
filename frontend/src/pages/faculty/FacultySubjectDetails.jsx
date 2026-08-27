import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  User,
} from "lucide-react";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

export default function FacultySubjectDetails() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  /* =====================================================
     FIND SELECTED SUBJECT
  ===================================================== */

  const subject = useMemo(() => {
    return subjects.find((item) => String(item.id) === String(subjectId));
  }, [subjectId]);

  /* =====================================================
     FIND ONLY THIS SUBJECT'S LECTURES

     subjectId is used first so lectures from another
     subject cannot accidentally appear here.

     The subject-name check is only a fallback for older
     frontend data that may not contain subjectId.
  ===================================================== */

  const subjectLectures = useMemo(() => {
    if (!subject) {
      return [];
    }

    return lectures.filter((lecture) => {
      if (lecture.subjectId) {
        return String(lecture.subjectId) === String(subject.id);
      }

      return lecture.subject?.toLowerCase() === subject.name?.toLowerCase();
    });
  }, [subject]);

  /* =====================================================
     OPEN SELECTED LECTURE
  ===================================================== */

  const openLecture = (lecture) => {
    const lecturerId = lecture.lecturerId || "unknown-lecturer";

    navigate(
      `/faculty/subjects/${subject.id}/lecturers/${lecturerId}/lectures/${lecture.id}`,
    );
  };

  /* =====================================================
     SUBJECT NOT FOUND
  ===================================================== */

  if (!subject) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/faculty/subjects")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={17} />
          Back to Subjects
        </button>

        <section
          className="card"
          style={{
            marginTop: 24,
            padding: 40,
            textAlign: "center",
          }}
        >
          <BookOpen size={42} />

          <h2
            style={{
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Subject Not Found
          </h2>

          <p className="muted">The selected subject could not be found.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page faculty-subject-details">
      {/* =================================================
          BACK
      ================================================= */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/faculty/subjects")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={17} />
        Back to Subjects
      </button>

      {/* =================================================
          SUBJECT HEADER
      ================================================= */}

      <section
        style={{
          marginTop: 20,
        }}
      >
        <p className="eyebrow">SUBJECT</p>

        <h1
          style={{
            marginBottom: 8,
          }}
        >
          {subject.name}
        </h1>

        {subject.code && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {subject.code}
          </p>
        )}

        <p
          className="muted"
          style={{
            marginTop: 8,
            marginBottom: 0,
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          {subject.description || `${subject.name} subject`}
        </p>
      </section>

      {/* =================================================
          LECTURE SUMMARY
      ================================================= */}

      <section
        className="card"
        style={{
          marginTop: 24,
          padding: 22,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          className="upload-icon"
          style={{
            flexShrink: 0,
          }}
        >
          <BookOpen size={22} />
        </div>

        <div>
          <p
            className="muted"
            style={{
              margin: 0,
              fontSize: 13,
            }}
          >
            Total Lectures
          </p>

          <h2
            style={{
              margin: "4px 0 0",
            }}
          >
            {subjectLectures.length}
          </h2>
        </div>
      </section>

      {/* =================================================
          LECTURES HEADER
      ================================================= */}

      <section
        style={{
          marginTop: 30,
        }}
      >
        <p className="eyebrow">LECTURES</p>

        <h2
          style={{
            marginTop: 4,
            marginBottom: 6,
          }}
        >
          Lectures in {subject.name}
        </h2>

        <p
          className="muted"
          style={{
            margin: 0,
          }}
        >
          Select a lecture to view its transcript, notes, flashcards, quiz,
          analytics and student progress.
        </p>
      </section>

      {/* =================================================
          NO LECTURES
      ================================================= */}

      {subjectLectures.length === 0 ? (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: 40,
            textAlign: "center",
          }}
        >
          <BookOpen size={42} />

          <h3
            style={{
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No Lectures Available
          </h3>

          <p
            className="muted"
            style={{
              margin: 0,
            }}
          >
            No lectures have been uploaded for this subject yet.
          </p>
        </section>
      ) : (
        /* =================================================
           LECTURE LIST
        ================================================= */

        <section
          style={{
            display: "grid",
            gap: 14,
            marginTop: 18,
          }}
        >
          {subjectLectures.map((lecture, index) => (
            <button
              key={lecture.id}
              type="button"
              className="card"
              onClick={() => openLecture(lecture)}
              style={{
                width: "100%",
                padding: 20,
                textAlign: "left",
                cursor: "pointer",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                {/* =====================================
                    LEFT
                ===================================== */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 15,
                    minWidth: 0,
                    flex: "1 1 400px",
                  }}
                >
                  <div
                    className="upload-icon"
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={21} />
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <p
                      className="eyebrow"
                      style={{
                        margin: 0,
                      }}
                    >
                      LECTURE {String(index + 1).padStart(2, "0")}
                    </p>

                    <h3
                      style={{
                        marginTop: 5,
                        marginBottom: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {lecture.title}
                    </h3>

                    {/* Lecturer */}

                    {lecture.lecturer && (
                      <div
                        className="muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 10,
                          fontSize: 13,
                        }}
                      >
                        <User size={14} />

                        <span>{lecture.lecturer}</span>
                      </div>
                    )}

                    {/* Date + Duration */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      {lecture.date && (
                        <span
                          className="muted"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                          }}
                        >
                          <CalendarDays size={13} />

                          {lecture.date}
                        </span>
                      )}

                      {lecture.duration && (
                        <span
                          className="muted"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                          }}
                        >
                          <Clock size={13} />

                          {lecture.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* =====================================
                    RIGHT
                ===================================== */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexShrink: 0,
                  }}
                >
                  {lecture.status && (
                    <span
                      className={`lecture-status ${
                        lecture.status?.toLowerCase() || ""
                      }`}
                    >
                      {lecture.status}
                    </span>
                  )}

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    View Lecture
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
