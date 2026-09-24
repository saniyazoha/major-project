import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, RefreshCw, Users, Award } from "lucide-react";
import { apiClient } from "../../api/client";

export default function FacultyQuizPerformance() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [lectureTitle, setLectureTitle] = useState("");
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      const [lecData, perfData] = await Promise.all([
        apiClient.get(`/lectures/${lectureId}`).catch(() => null),
        apiClient.get(`/lectures/${lectureId}/quiz-performance`),
      ]);

      if (lecData?.title) {
        setLectureTitle(lecData.title);
      }

      setPerformance(perfData);
    } catch (err) {
      console.error("Failed to load faculty quiz performance:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load quiz performance.");
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchPerformance();
    }
  }, [lectureId]);

  if (loading) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/faculty/lectures/${lectureId}`)}
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={16} /> Back to Lecture Details
        </button>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: "#1687c9", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b", margin: 0 }}>Loading quiz performance...</p>
        </div>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/faculty/subjects")}
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={16} /> Back to Subjects
        </button>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <AlertCircle size={36} style={{ color: "#b42318", margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#0f274f", fontSize: 18 }}>Access Denied</h3>
          <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
            You do not have permission to view quiz performance for this lecture.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/faculty/lectures/${lectureId}`)}
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={16} /> Back to Lecture Details
        </button>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <AlertCircle size={36} style={{ color: "#b42318", margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#0f274f", fontSize: 18 }}>Failed to Load Performance</h3>
          <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: 14 }}>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchPerformance}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const studentsAttempted = performance?.students_attempted || 0;
  const averageScore = performance?.average_score ?? 0;
  const studentResults = performance?.student_results || [];
  const mostMissed = performance?.most_missed_questions || [];

  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* HEADER */}
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(`/faculty/lectures/${lectureId}`)}
        style={{ marginBottom: 16 }}
      >
        <ArrowLeft size={16} /> Back to Lecture Details
      </button>

      <section style={{ marginBottom: 24 }}>
        <p className="eyebrow">FACULTY ASSESSMENT ANALYTICS</p>
        <h1 style={{ margin: "6px 0 0", color: "#0f274f", fontSize: 30 }}>
          Quiz Performance: {lectureTitle || `Lecture #${lectureId}`}
        </h1>
      </section>

      {/* METRIC CARDS GRID */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* CARD 1: STUDENTS ATTEMPTED */}
        <div
          className="card"
          style={{
            padding: 24,
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              Students Attempted
            </p>
            <Users size={20} style={{ color: "#1687c9" }} />
          </div>
          <strong
            style={{
              display: "block",
              marginTop: 12,
              color: "#0f274f",
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {studentsAttempted}
          </strong>
          <p style={{ margin: "10px 0 0", color: "#68778d", fontSize: 13 }}>
            Distinct student{studentsAttempted !== 1 ? "s" : ""} with recorded attempts
          </p>
        </div>

        {/* CARD 2: AVERAGE SCORE */}
        <div
          className="card"
          style={{
            padding: 24,
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              Average Score
            </p>
            <Award size={20} style={{ color: "#087044" }} />
          </div>
          <strong
            style={{
              display: "block",
              marginTop: 12,
              color: "#0f274f",
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {studentsAttempted > 0 ? `${averageScore}%` : "0%"}
          </strong>
          <p style={{ margin: "10px 0 0", color: "#68778d", fontSize: 13 }}>
            Average percentage score across attempted students
          </p>
        </div>
      </section>

      {/* INDIVIDUAL STUDENT RESULTS TABLE */}
      <section style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, borderRadius: 15 }}>
          <p className="eyebrow">STUDENT BREAKDOWN</p>
          <h3 style={{ margin: "6px 0 16px", color: "#0f274f", fontSize: 18 }}>
            Individual Student Results
          </h3>

          {studentsAttempted === 0 ? (
            <div style={{ padding: "20px 0", color: "#68778d", fontSize: 14 }}>
              No student attempts recorded for this lecture yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e2e8f0",
                      color: "#566782",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <th style={{ padding: "12px 16px" }}>Student</th>
                    <th style={{ padding: "12px 16px" }}>Score</th>
                    <th style={{ padding: "12px 16px" }}>Correct / Total</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map((st) => (
                    <tr
                      key={st.student_id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f274f" }}>
                          {st.student_name}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {st.student_email}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: st.score_percentage >= 70 ? "#e8f3ed" : st.score_percentage >= 40 ? "#fef3c7" : "#fee2e2",
                            color: st.score_percentage >= 70 ? "#087044" : st.score_percentage >= 40 ? "#92400e" : "#991b1b",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {st.score_percentage}%
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>
                        {st.correct_count} / {st.total_questions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* MOST MISSED QUESTIONS */}
      <section style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, borderRadius: 15 }}>
          <p className="eyebrow">DIAGNOSTIC FEEDBACK</p>
          <h3 style={{ margin: "6px 0 16px", color: "#0f274f", fontSize: 18 }}>
            Most-Missed Questions
          </h3>

          {studentsAttempted === 0 ? (
            <div style={{ padding: "20px 0", color: "#68778d", fontSize: 14 }}>
              No quiz attempts recorded yet. Most-missed questions will be highlighted here once students take the quiz.
            </div>
          ) : mostMissed.length === 0 ? (
            <div style={{ padding: "20px 0", color: "#166534", fontSize: 14, fontWeight: 500 }}>
              Great job! All attempted questions were answered correctly by students.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {mostMissed.map((item, idx) => {
                const missPct = Math.round((item.incorrect_count / item.total_attempts) * 100);
                return (
                  <div
                    key={item.quiz_id}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 10,
                      background: "#fafafa",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "#fee2e2",
                            color: "#991b1b",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          #{idx + 1} Most Missed
                        </span>
                        <span style={{ color: "#64748b", fontSize: 12 }}>
                          Quiz Question ID #{item.quiz_id}
                        </span>
                      </div>
                      <h4
                        style={{
                          margin: "8px 0 0",
                          color: "#0f274f",
                          fontSize: 15,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.question}
                      </h4>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 16 }}>
                        {item.incorrect_count} / {item.total_attempts} missed
                      </span>
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                        {missPct}% error rate
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

