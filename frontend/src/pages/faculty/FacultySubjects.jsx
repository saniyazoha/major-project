import { ArrowRight, BookOpen, Loader2, Plus, X, AlertCircle, CheckCircle2 } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

function FacultySubjects() {
  const navigate = useNavigate();

  const [realSubjects, setRealSubjects] = useState([]);
  const [realLectures, setRealLectures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Subject Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchSubjectsData = async () => {
    try {
      setIsLoading(true);
      const [fetchedSubjects, fetchedLectures] = await Promise.all([
        apiClient.get("/subjects").catch(() => []),
        apiClient.get("/lectures").catch(() => []),
      ]);

      if (Array.isArray(fetchedSubjects)) {
        setRealSubjects(fetchedSubjects);
      }
      if (Array.isArray(fetchedLectures)) {
        setRealLectures(fetchedLectures);
      }
      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to load subjects data:", err);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectsData();
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

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      setFormError("Subject name cannot be empty.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      setSuccessMsg(null);

      const res = await apiClient.post("/subjects", {
        name: trimmedName,
      });

      setSuccessMsg(`Subject "${res?.name || trimmedName}" created successfully!`);
      setNewSubjectName("");

      await fetchSubjectsData();

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
      }, 1000);
    } catch (err) {
      console.error("Failed to create subject:", err);
      setFormError(err?.message || "Failed to create subject. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div>
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
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={() => {
            setFormError(null);
            setSuccessMsg(null);
            setNewSubjectName("");
            setIsModalOpen(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 9,
            background: "#2f76d2",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(23, 59, 109, 0.18)",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={18} />
          Create Subject
        </button>
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

          <button
            type="button"
            className="primary-action-button"
            onClick={() => {
              setFormError(null);
              setSuccessMsg(null);
              setNewSubjectName("");
              setIsModalOpen(true);
            }}
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 9,
              background: "#2f76d2",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Create Your First Subject
          </button>
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

      {/* =================================================
          CREATE SUBJECT MODAL
      ================================================= */}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 39, 79, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 28,
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 20px 40px rgba(15, 39, 79, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>NEW SUBJECT</p>
                <h3 style={{ margin: "4px 0 0", color: "#0f274f", fontSize: 20 }}>
                  Create Subject
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: isSubmitting ? "default" : "pointer",
                  color: "#64748b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubject}>
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="subject-name-input"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: 6,
                  }}
                >
                  Subject Name
                </label>
                <input
                  id="subject-name-input"
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 9,
                    border: "1px solid #dce1e8",
                    fontSize: 14,
                    color: "#0f274f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "1px solid #dce1e8",
                    background: "#ffffff",
                    color: "#53657d",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !newSubjectName.trim()}
                  style={{
                    height: 40,
                    padding: "0 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2f76d2",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmitting || !newSubjectName.trim() ? "not-allowed" : "pointer",
                    opacity: isSubmitting || !newSubjectName.trim() ? 0.6 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {isSubmitting ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultySubjects;
