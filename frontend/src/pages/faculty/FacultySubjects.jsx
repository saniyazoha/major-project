import { ArrowRight, BookOpen, Loader2 } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

import { subjects as mockSubjects } from "../../data/subjects";
import { lectures as mockLectures } from "../../data/lectures";

function FacultySubjects() {
  const navigate = useNavigate();

  const [realSubjects, setRealSubjects] = useState([]);
  const [realLectures, setRealLectures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [fetchedSubjects, fetchedLectures] = await Promise.all([
          apiClient.get("/subjects").catch(() => []),
          apiClient.get("/lectures").catch(() => []),
        ]);

        if (isMounted) {
          if (Array.isArray(fetchedSubjects)) {
            setRealSubjects(fetchedSubjects);
          }
          if (Array.isArray(fetchedLectures)) {
            setRealLectures(fetchedLectures);
          }
          setIsLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoaded(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const subjectsWithLectures = useMemo(() => {
    if (!isLoaded) return [];

    return realSubjects.map((subject) => {
      const count = realLectures.filter(
        (l) => String(l.subject_id) === String(subject.id)
      ).length;

      return {
        id: subject.id,
        name: subject.name,
        code: `SUB-${subject.id}`,
        description: `${subject.name} course subject`,
        lectureCount: count,
      };
    });
  }, [isLoaded, realSubjects, realLectures]);

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

      {isLoading ? (
        <section
          className="card"
          style={{
            marginTop: 24,
            padding: 40,
            textAlign: "center",
            color: "#667085",
          }}
        >
          <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p style={{ margin: 0, fontSize: 14 }}>Loading subjects...</p>
        </section>
      ) : subjectsWithLectures.length === 0 ? (
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
            No subjects found for your faculty account on the backend.
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
