import { ArrowLeft, Send, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiClient } from "../../api/client";

export default function FacultyDoubtDetails() {
  const navigate = useNavigate();
  const { lectureId, doubtId } = useParams();

  const [lecture, setLecture] = useState(null);
  const [doubt, setDoubt] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      const [lecData, doubtData] = await Promise.all([
        apiClient.get(`/lectures/${lectureId}`),
        apiClient.get(`/doubts/${doubtId}`),
      ]);

      setLecture(lecData);
      setDoubt(doubtData);
    } catch (err) {
      console.error("Failed to load faculty doubt details:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load doubt details.");
      setLecture(null);
      setDoubt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId && doubtId) {
      fetchData();
    }
  }, [lectureId, doubtId]);

  const sendReply = async () => {
    const cleanedReply = reply.trim();

    if (!doubt || !cleanedReply || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const updatedDoubt = await apiClient.patch(`/doubts/${doubtId}/answer`, {
        answer: cleanedReply,
      });

      setDoubt(updatedDoubt);
      setReply("");
    } catch (err) {
      console.error("Failed to submit doubt answer:", err);
      alert(err?.message || "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 30, textAlign: "center" }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p style={{ margin: 0, color: "#667085" }}>Loading doubt details...</p>
        </div>
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404 || !lecture || !doubt) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/faculty/lectures/${lectureId}/doubts`)}
        >
          <ArrowLeft size={16} />
          Back to Doubt Session
        </button>
        <div className="card" style={{ marginTop: 20, padding: 30 }}>
          <h2>{errorStatus === 403 ? "Access Denied" : "Doubt Not Found"}</h2>
          <p style={{ marginTop: 8, color: "#667085" }}>
            {error || "The requested doubt details could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(`/faculty/lectures/${lecture.id}/doubts`)}
      >
        <ArrowLeft size={16} />
        Back to Doubt Session
      </button>

      <section style={{ marginTop: 20 }}>
        <p className="eyebrow">DOUBT DETAILS</p>
        <h1 style={{ marginTop: 6, marginBottom: 0, fontSize: 31 }}>
          {lecture.title}
        </h1>
      </section>

      <section className="card" style={{ marginTop: 20, padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">STUDENT</p>
            <h3 style={{ margin: "4px 0 0" }}>
              {doubt.studentName || (doubt.student_id ? `Student #${doubt.student_id}` : "Student")}
            </h3>
            <p className="muted" style={{ margin: "5px 0 0", fontSize: 12 }}>
              USN: {doubt.usn || (doubt.student_id ? `STU-${doubt.student_id}` : "Not available")}
            </p>
          </div>
          <div style={{ color: "#667085", fontSize: 12 }}>
            <strong style={{ color: "#344054" }}>Status:</strong>{" "}
            <span style={{ textTransform: "capitalize" }}>
              {doubt.status || "pending"}
            </span>
            <br />
            <strong style={{ color: "#344054" }}>Submitted:</strong>{" "}
            {formatDate(doubt.created_at)}
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #e7ebf0",
          }}
        >
          <p className="eyebrow">QUESTION</p>
          <p style={{ margin: "8px 0 0", color: "#344054", lineHeight: 1.7 }}>
            {doubt.question}
          </p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18, padding: 22 }}>
        <p className="eyebrow">CONVERSATION</p>
        <div
          style={{
            marginTop: 14,
            padding: "13px 15px",
            borderRadius: "14px 14px 14px 4px",
            background: "#eef2f7",
            color: "#334155",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {doubt.question}
        </div>

        {doubt.answer && (
          <div
            style={{
              maxWidth: "76%",
              margin: "14px 0 0 auto",
              padding: "13px 15px",
              borderRadius: "14px 14px 4px 14px",
              background: "#2f76d2",
              color: "#ffffff",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {doubt.answer}
            <small style={{ display: "block", marginTop: 8, opacity: 0.8 }}>
              {doubt.answered_by ? `Faculty #${doubt.answered_by}` : "Faculty"}
              {doubt.answered_at ? ` • ${formatDate(doubt.answered_at)}` : ""}
            </small>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <input
            type="text"
            value={reply}
            disabled={submitting || doubt.status === "answered"}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendReply();
              }
            }}
            placeholder={
              doubt.status === "answered"
                ? "This doubt has already been answered."
                : "Write a reply..."
            }
            style={{
              flex: 1,
              minHeight: 44,
              padding: "10px 13px",
              border: "1px solid #dce1e8",
              borderRadius: 9,
              outline: "none",
              color: "#334155",
              background: "#ffffff",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            className="primary-action-button"
            onClick={sendReply}
            disabled={!reply.trim() || submitting || doubt.status === "answered"}
          >
            <Send size={15} />
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </section>
    </div>
  );
}
