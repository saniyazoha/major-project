import { ArrowLeft, User, BarChart3, BookOpen } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

export default function FacultySubjectDetails() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  // =========================================
  // FIND SELECTED SUBJECT
  // =========================================

  const subject = useMemo(() => {
    return subjects.find((item) => String(item.id) === String(subjectId));
  }, [subjectId]);

  // =========================================
  // FIND LECTURES FOR THIS SUBJECT
  // =========================================

  const subjectLectures = useMemo(() => {
    if (!subject) {
      return [];
    }

    return lectures.filter(
      (lecture) => String(lecture.subjectId) === String(subject.id),
    );
  }, [subject]);

  // =========================================
  // GROUP LECTURES BY LECTURER
  // =========================================

  const lecturers = useMemo(() => {
    const lecturerMap = new Map();

    subjectLectures.forEach((lecture) => {
      const lecturerId = String(lecture.lecturerId);

      if (!lecturerMap.has(lecturerId)) {
        lecturerMap.set(lecturerId, {
          id: lecture.lecturerId,
          name: lecture.lecturer || "Unknown Lecturer",
          lectures: [],
        });
      }

      lecturerMap.get(lecturerId).lectures.push(lecture);
    });

    return Array.from(lecturerMap.values());
  }, [subjectLectures]);

  // =========================================
  // SUBJECT NOT FOUND
  // =========================================

  if (!subject) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/faculty/subjects")}
          style={{
            display: "flex",
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

          <h2>Subject Not Found</h2>

          <p className="muted">The selected subject could not be found.</p>

          <p
            className="muted"
            style={{
              fontSize: 13,
            }}
          >
            Subject ID: {subjectId}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page faculty-subject-details">
      {/* =========================================
          BACK BUTTON
      ========================================= */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/faculty/subjects")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={17} />
        Back to Subjects
      </button>

      {/* =========================================
          SUBJECT HEADER
      ========================================= */}

      <section
        style={{
          marginTop: 20,
        }}
      >
        <p className="eyebrow">SUBJECT</p>

        <h1>{subject.name}</h1>

        <p className="muted">
          {subject.description || `${subject.name} subject`}
        </p>

        <p
          className="muted"
          style={{
            marginTop: 8,
            fontSize: 14,
          }}
        >
          Select a lecturer and then choose a specific lecture to view its
          analytics.
        </p>
      </section>

      {/* =========================================
          LECTURER COUNT
      ========================================= */}

      <section
        className="card"
        style={{
          marginTop: 24,
          padding: 24,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
          }}
        >
          <User size={24} />
        </div>

        <div>
          <p
            className="muted"
            style={{
              margin: 0,
            }}
          >
            Lecturers
          </p>

          <h2
            style={{
              margin: "4px 0 0",
            }}
          >
            {lecturers.length}
          </h2>
        </div>
      </section>

      {/* =========================================
          LECTURERS
      ========================================= */}

      <section
        style={{
          marginTop: 28,
        }}
      >
        <p className="eyebrow">LECTURERS</p>

        <h2
          style={{
            margin: "4px 0 0",
          }}
        >
          Lecturers under {subject.name}
        </h2>

        <p className="muted">Each lecturer's lectures are shown separately.</p>

        {/* =====================================
            NO LECTURERS
        ===================================== */}

        {lecturers.length === 0 ? (
          <div
            className="card"
            style={{
              marginTop: 20,
              padding: 40,
              textAlign: "center",
            }}
          >
            <User
              size={42}
              style={{
                marginBottom: 10,
              }}
            />

            <h3>No Lecturers Found</h3>

            <p className="muted">
              No lectures have been uploaded for this subject yet.
            </p>
          </div>
        ) : (
          /* =====================================
             LECTURER GRID
          ===================================== */

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
              marginTop: 20,
            }}
          >
            {lecturers.map((lecturer) => (
              <div
                key={lecturer.id}
                className="card"
                style={{
                  padding: 24,
                }}
              >
                {/* Lecturer Header */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={23} />
                  </div>

                  <BarChart3 size={22} />
                </div>

                {/* Lecturer Name */}

                <h3
                  style={{
                    marginTop: 20,
                    marginBottom: 5,
                  }}
                >
                  {lecturer.name}
                </h3>

                <p className="muted">
                  {lecturer.lectures.length}{" "}
                  {lecturer.lectures.length === 1 ? "lecture" : "lectures"}
                </p>

                {/* =================================
                    LECTURES FOR THIS LECTURER
                ================================= */}

                <div
                  style={{
                    marginTop: 18,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  {lecturer.lectures.map((lecture) => (
                    <div
                      key={lecture.id}
                      style={{
                        padding: 14,
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          lineHeight: 1.4,
                        }}
                      >
                        {lecture.title}
                      </strong>

                      <button
                        type="button"
                        className="secondary-action-button"
                        onClick={() =>
                          navigate(
                            `/faculty/subjects/${subject.id}/lecturers/${lecturer.id}/lectures/${lecture.id}/analytics`,
                          )
                        }
                        style={{
                          marginTop: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        View Analytics
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
