import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useAuthContext } from "../../context/AuthContext";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [subjects, setSubjects] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [quizStats, setQuizStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const username =
    user?.name || user?.username || localStorage.getItem("username") || "Student";
  const firstName = username.trim().split(" ")[0] || "Student";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student quiz stats in parallel
      apiClient
        .get("/lectures/student/quiz-stats")
        .then((res) => setQuizStats(res))
        .catch(() => setQuizStats(null));

      // 1. Fetch enrolled subjects
      const subjectsRes = await apiClient.get("/subjects");
      const subjectsList = Array.isArray(subjectsRes)
        ? subjectsRes
        : subjectsRes?.data || [];
      setSubjects(subjectsList);

      if (subjectsList.length === 0) {
        setLectures([]);
        setLoading(false);
        return;
      }

      // 2. Fetch enrolled batches & lectures for each subject
      const allLectures = [];
      const seenIds = new Set();

      for (const subject of subjectsList) {
        try {
          const batchesRes = await apiClient.get(
            `/subjects/${subject.id}/batches`,
          );
          const batchesList = Array.isArray(batchesRes)
            ? batchesRes
            : batchesRes?.data || [];

          for (const batch of batchesList) {
            try {
              const lecturesRes = await apiClient.get(
                `/lectures?batch_id=${batch.id}`,
              );
              const lecturesList = Array.isArray(lecturesRes)
                ? lecturesRes
                : lecturesRes?.data || [];

              for (const lecture of lecturesList) {
                if (!seenIds.has(lecture.id)) {
                  seenIds.add(lecture.id);
                  allLectures.push({
                    ...lecture,
                    subjectCode: subject.code || subject.name,
                    subjectName: subject.name,
                    batchName: batch.name || `Batch ${batch.id}`,
                  });
                }
              }
            } catch (err) {
              console.error(
                `Failed to load lectures for batch ${batch.id}:`,
                err,
              );
            }
          }
        } catch (err) {
          console.error(
            `Failed to load batches for subject ${subject.id}:`,
            err,
          );
        }
      }

      // Sort lectures by date descending (newest first)
      allLectures.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );

      setLectures(allLectures);
    } catch (err) {
      console.error("Failed to load student dashboard data:", err);
      setError(
        err.message || "Failed to load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const completedLectures = lectures.filter(
    (l) => l.status === "broadcast" || l.status === "Processed" || l.status === "processed",
  ).length;
  const totalLectures = lectures.length;

  return (
    <div
      className="page"
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        paddingTop: 10,
      }}
    >
      {/* =====================================================
          WELCOME HEADER
      ===================================================== */}

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0f274f",
                fontSize: 34,
                lineHeight: 1.2,
                fontWeight: 700,
                letterSpacing: "-0.7px",
              }}
            >
              Welcome back, {firstName}
            </h1>

            <p
              style={{
                margin: "5px 0 0",
                color: "#68778d",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Here's what your faculty has released recently.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            style={{
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid #e2e8f0",
              borderRadius: 9,
              background: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginTop: 25,
        }}
      >
        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Enrolled Subjects
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {loading ? "..." : subjects.length}
          </strong>
        </div>

        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Available Lectures
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {loading ? "..." : totalLectures}
          </strong>
        </div>

        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Processed Lectures
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {loading ? "..." : `${completedLectures}/${totalLectures}`}
          </strong>
        </div>

        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Avg. Quiz Score
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color:
                quizStats?.average_score !== null &&
                quizStats?.average_score !== undefined
                  ? "#0f274f"
                  : "#68778d",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {loading
              ? "..."
              : quizStats?.average_score !== null &&
                quizStats?.average_score !== undefined
              ? `${Math.round(quizStats.average_score)}%`
              : "N/A"}
          </strong>
        </div>
      </section>

      {/* =====================================================
          AVAILABLE LECTURES
      ===================================================== */}

      <section
        style={{
          marginTop: 39,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0f274f",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Available lectures
        </h2>

        {loading ? (
          <div
            className="card"
            style={{
              marginTop: 14,
              padding: 32,
              borderRadius: 15,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <RefreshCw size={28} className="animate-spin" style={{ color: "#1f6feb" }} />
            <p style={{ margin: 0, color: "#68778d", fontSize: 14 }}>
              Loading your dashboard lectures...
            </p>
          </div>
        ) : error ? (
          <div
            className="card"
            style={{
              marginTop: 14,
              padding: 32,
              borderRadius: 15,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertCircle size={32} style={{ color: "#e11d48" }} />
            <h3 style={{ margin: 0, color: "#0f274f", fontSize: 16, fontWeight: 700 }}>
              Failed to load dashboard
            </h3>
            <p style={{ margin: 0, color: "#68778d", fontSize: 14 }}>{error}</p>
            <button
              type="button"
              className="secondary-action-button"
              onClick={fetchDashboardData}
              style={{ marginTop: 8 }}
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div
            className="card"
            style={{
              marginTop: 14,
              padding: 32,
              borderRadius: 15,
              textAlign: "center",
            }}
          >
            <BookOpen size={32} style={{ margin: "0 auto 12px", color: "#68778d" }} />
            <h3 style={{ margin: "0 0 6px", color: "#0f274f", fontSize: 16, fontWeight: 700 }}>
              No subjects enrolled
            </h3>
            <p
              style={{
                margin: 0,
                color: "#68778d",
                fontSize: 14,
              }}
            >
              You are not currently enrolled in any active subjects.
            </p>
          </div>
        ) : lectures.length === 0 ? (
          <div
            className="card"
            style={{
              marginTop: 14,
              padding: 32,
              borderRadius: 15,
              textAlign: "center",
            }}
          >
            <BookOpen size={32} style={{ margin: "0 auto 12px", color: "#68778d" }} />
            <h3 style={{ margin: "0 0 6px", color: "#0f274f", fontSize: 16, fontWeight: 700 }}>
              No lectures available
            </h3>
            <p
              style={{
                margin: 0,
                color: "#68778d",
                fontSize: 14,
              }}
            >
              Broadcast lectures for your enrolled subjects will appear here when available.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 13,
              marginTop: 14,
            }}
          >
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/student/lectures/${lecture.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/student/lectures/${lecture.id}`);
                  }
                }}
                style={{
                  width: "100%",
                  minHeight: 132,
                  padding: "22px 24px",
                  background: "#ffffff",
                  border: "1px solid #e1e7ef",
                  borderRadius: 15,
                  boxShadow: "0 10px 26px rgba(15, 39, 79, 0.07)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: "#1f6feb",
                        fontSize: 17,
                        lineHeight: 1.4,
                        fontWeight: 700,
                      }}
                    >
                      {lecture.title}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      {lecture.subjectCode && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            minHeight: 23,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: "#eef2f7",
                            color: "#64748b",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {lecture.subjectCode}
                        </span>
                      )}

                      {lecture.batchName && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            minHeight: 23,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: "#eef2f7",
                            color: "#64748b",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {lecture.batchName}
                        </span>
                      )}
                    </div>
                  </div>

                  {lecture.status && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        flexShrink: 0,
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: "#e9f7ef",
                        color: "#179253",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#27a568",
                        }}
                      />

                      {lecture.status}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 17,
                    marginTop: 14,
                    color: "#68778d",
                    fontSize: 12,
                  }}
                >
                  {lecture.created_at && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <CalendarDays size={14} />
                      {formatDate(lecture.created_at)}
                    </span>
                  )}

                  {lecture.file_size && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <Clock size={14} />
                      {formatFileSize(lecture.file_size)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
