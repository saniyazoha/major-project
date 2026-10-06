import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../../api/client";

function StudentProgress() {
  const navigate = useNavigate();

  const [quizStats, setQuizStats] = useState(null);
  const [lecturesCount, setLecturesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch quiz stats for current student
      const quizRes = await apiClient.get("/students/quiz-stats");
      setQuizStats(quizRes);

      // 2. Fetch enrollment-scoped lectures for current student
      const lecturesRes = await apiClient.get("/lectures");
      const list = Array.isArray(lecturesRes) ? lecturesRes : lecturesRes?.data || [];
      setLecturesCount(list.length);
    } catch (err) {
      console.error("Failed to load student progress data:", err);
      setError(err?.message || "Failed to load study progress.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const avgScoreText =
    quizStats?.average_score !== null && quizStats?.average_score !== undefined
      ? `${Math.round(quizStats.average_score)}%`
      : "N/A";

  const totalAttempts = quizStats?.total_attempts ?? 0;

  return (
    <div className="page student-page student-progress-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <p className="eyebrow">ACADEMIC ANALYTICS</p>

          <h1>Study Progress</h1>

          <p className="muted">
            Track your academic quiz performance and available course materials.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
      </div>

      {loading ? (
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 20,
          }}
        >
          <RefreshCw size={28} className="animate-spin" style={{ color: "#1f6feb" }} />
          <p style={{ margin: 0, color: "#68778d" }}>Loading study progress...</p>
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            padding: 32,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 20,
          }}
        >
          <AlertCircle size={32} style={{ color: "#e11d48" }} />
          <p style={{ margin: 0, color: "#68778d" }}>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchProgressData}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : (
        <section className="student-progress-statistics" style={{ marginTop: 24 }}>
          {/* Broadcast Lectures Available */}
          <div className="card student-progress-stat">
            <div className="student-progress-stat-icon">
              <BookOpen size={19} />
            </div>

            <div>
              <span>BROADCAST LECTURES AVAILABLE</span>

              <strong>{lecturesCount}</strong>
            </div>
          </div>

          {/* Quiz Score */}
          <div className="card student-progress-stat">
            <div className="student-progress-stat-icon">
              <ClipboardCheck size={19} />
            </div>

            <div>
              <span>AVG. QUIZ SCORE</span>

              <strong>{avgScoreText}</strong>
            </div>
          </div>

          {/* Quizzes Attempted */}
          <div className="card student-progress-stat">
            <div className="student-progress-stat-icon">
              <ClipboardList size={19} />
            </div>

            <div>
              <span>QUIZZES ATTEMPTED</span>

              <strong>{totalAttempts}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default StudentProgress;
