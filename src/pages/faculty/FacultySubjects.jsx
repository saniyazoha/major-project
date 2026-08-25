import { ArrowRight, BookOpen } from "lucide-react";

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

function FacultySubjects() {
  const navigate = useNavigate();

  /* =====================================================
     SUBJECTS WITH LECTURE COUNTS

     Nothing is removed or recreated here.
     All subjects continue to come from subjects.js.
  ===================================================== */

  const subjectsWithLectures = useMemo(() => {
    return subjects.map((subject) => {
      const subjectLectures = lectures.filter((lecture) => {
        if (
          lecture.subjectId &&
          String(lecture.subjectId) === String(subject.id)
        ) {
          return true;
        }

        return lecture.subject?.toLowerCase() === subject.name?.toLowerCase();
      });

      return {
        ...subject,
        lectureCount: subjectLectures.length,
      };
    });
  }, []);

  /* =====================================================
     OPEN SUBJECT
  ===================================================== */

  const openSubject = (subjectId) => {
    navigate(`/faculty/subjects/${subjectId}`);
  };

  return (
    <div className="page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section>
        <p className="eyebrow">SUBJECTS</p>

        <h1
          style={{
            marginBottom: 8,
          }}
        >
          Subjects
        </h1>

        <p
          className="muted"
          style={{
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          Select a subject to view all lectures available under it.
        </p>
      </section>

      {/* =================================================
          SUBJECT CARDS
      ================================================= */}

      {subjectsWithLectures.length === 0 ? (
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
              marginTop: 14,
            }}
          >
            No Subjects Available
          </h2>

          <p className="muted">
            Subjects will appear here when they are available.
          </p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {subjectsWithLectures.map((subject) => (
            <button
              key={subject.id}
              type="button"
              className="card"
              onClick={() => openSubject(subject.id)}
              style={{
                width: "100%",
                minHeight: 230,
                textAlign: "left",
                padding: 22,
                cursor: "pointer",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* =========================================
                  CARD TOP
              ========================================= */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div className="upload-icon">
                  <BookOpen size={22} />
                </div>

                <ArrowRight size={18} />
              </div>

              {/* =========================================
                  SUBJECT
              ========================================= */}

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {subject.name}
                </h3>

                {subject.code && (
                  <p
                    className="muted"
                    style={{
                      marginTop: 6,
                      marginBottom: 0,
                    }}
                  >
                    {subject.code}
                  </p>
                )}

                {subject.description && (
                  <p
                    className="muted"
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    {subject.description}
                  </p>
                )}
              </div>

              {/* =========================================
                  LECTURE COUNT
              ========================================= */}

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 20,
                }}
              >
                <p
                  className="muted"
                  style={{
                    margin: 0,
                    fontSize: 13,
                  }}
                >
                  {subject.lectureCount}{" "}
                  {subject.lectureCount === 1 ? "lecture" : "lectures"}
                </p>

                <strong
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 9,
                    fontSize: 13,
                  }}
                >
                  View Lectures
                  <ArrowRight size={14} />
                </strong>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

export default FacultySubjects;
