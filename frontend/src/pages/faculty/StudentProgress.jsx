import { useEffect, useState } from "react";
import { ArrowLeft, Users, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

export default function StudentProgress() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get("/faculty/student-progress");
      const list = Array.isArray(res) ? res : res?.data || [];
      setStudents(list);
    } catch (err) {
      console.error("Failed to load student progress:", err);
      setError(err?.message || "Failed to load student progress.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  return (
    <div className="page">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/faculty/dashboard")}
        style={{
          border: "none",
          background: "transparent",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: 0,
          fontSize: 15,
          color: "#5f6f86",
        }}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      {/* Header */}
      <section
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 38,
              lineHeight: 1.15,
            }}
          >
            Student progress
          </h1>

          <p
            className="muted"
            style={{
              marginTop: 7,
              marginBottom: 0,
              fontSize: 16,
            }}
          >
            View student quiz scores and quiz attempt performance across your subjects.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 12px",
            borderRadius: 999,
            background: "#eef2f7",
            color: "#506176",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Users size={16} />
          {students.length} students
        </div>
      </section>

      {/* Student List */}
      {loading ? (
        <div
          className="card"
          style={{
            marginTop: 32,
            padding: 40,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <RefreshCw size={28} className="animate-spin" style={{ color: "#1f6feb" }} />
          <p style={{ margin: 0, color: "#68778d" }}>Loading enrolled student progress...</p>
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            marginTop: 32,
            padding: 32,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AlertCircle size={32} style={{ color: "#e11d48" }} />
          <p style={{ margin: 0, color: "#68778d" }}>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchStudentProgress}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : students.length === 0 ? (
        <div
          className="card"
          style={{
            marginTop: 32,
            padding: 32,
            textAlign: "center",
          }}
        >
          <Users size={32} style={{ margin: "0 auto 12px", color: "#68778d" }} />
          <h3 style={{ margin: "0 0 6px", color: "#0f274f", fontSize: 16, fontWeight: 700 }}>
            No enrolled students found
          </h3>
          <p style={{ margin: 0, color: "#68778d", fontSize: 14 }}>
            Students enrolled in batches belonging to your subjects will appear here.
          </p>
        </div>
      ) : (
        <section
          className="card"
          style={{
            marginTop: 32,
            padding: 0,
            overflow: "hidden",
          }}
        >
          {students.map((student, index) => (
            <div
              key={student.student_id}
              style={{
                width: "100%",
                borderBottom:
                  index !== students.length - 1
                    ? "1px solid var(--border-color, #e2e8f0)"
                    : "none",
                background: "transparent",
                padding: "22px 24px",
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                alignItems: "center",
                gap: 16,
                textAlign: "left",
              }}
            >
              {/* Row number */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#eef2f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </div>

              {/* Student information */}
              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f274f",
                  }}
                >
                  {student.rollno}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: "#627188",
                    fontSize: 14,
                  }}
                >
                  {student.name} · {student.batch_name}
                </div>
              </div>

              {/* Quiz Stats */}
              <div
                style={{
                  textAlign: "right",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f274f",
                  }}
                >
                  Avg Score:{" "}
                  {student.avg_score !== null && student.avg_score !== undefined
                    ? `${Math.round(student.avg_score)}%`
                    : "N/A"}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    color: "#627188",
                    fontSize: 12,
                  }}
                >
                  {student.quizzes_attempted} quizzes attempted
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
